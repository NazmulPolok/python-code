const Ride = require('../models/Ride');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Store active ride connections
const activeRides = new Map();
const activeDrivers = new Map();

const rideSocket = (io, socket) => {
  // Driver goes online/offline
  socket.on('driverStatus', async (data) => {
    try {
      const { isAvailable, location } = data;
      
      if (!socket.userId) {
        socket.emit('rideError', { error: 'Not authenticated' });
        return;
      }
      
      // Update driver availability
      const driver = await User.findById(socket.userId);
      if (driver.role !== 'rider') {
        socket.emit('rideError', { error: 'Only riders can set driver status' });
        return;
      }
      
      driver.isAvailable = isAvailable;
      if (location) {
        driver.location.coordinates = location.coordinates;
        driver.location.address = location.address;
      }
      await driver.save();
      
      if (isAvailable) {
        activeDrivers.set(socket.userId, {
          socketId: socket.id,
          location: driver.location,
          vehicle: driver.vehicle
        });
      } else {
        activeDrivers.delete(socket.userId);
      }
      
      socket.emit('driverStatusUpdated', { isAvailable });
      console.log(`Driver ${socket.userId} is now ${isAvailable ? 'available' : 'unavailable'}`);
      
    } catch (error) {
      console.error('Error updating driver status:', error);
      socket.emit('rideError', { 
        error: 'Failed to update driver status',
        details: error.message 
      });
    }
  });

  // Passenger requests a ride
  socket.on('requestRide', async (data) => {
    try {
      const { pickupLocation, dropoffLocation, vehicleType, preferences } = data;
      
      if (!socket.userId) {
        socket.emit('rideError', { error: 'Not authenticated' });
        return;
      }
      
      // Create ride request
      const ride = new Ride({
        passenger: socket.userId,
        pickupLocation,
        dropoffLocation,
        vehicleType: vehicleType || 'car',
        preferences: preferences || {}
      });
      
      // Calculate estimated distance and fare (simplified)
      const distance = calculateDistance(
        pickupLocation.coordinates,
        dropoffLocation.coordinates
      );
      ride.estimatedDistance = distance;
      ride.estimatedDuration = Math.ceil(distance * 2); // Rough estimate
      ride.estimatedFare = ride.calculateFare();
      
      await ride.save();
      
      // Store ride in active rides
      activeRides.set(ride._id.toString(), {
        socketId: socket.id,
        passengerId: socket.userId
      });
      
      socket.emit('rideRequested', {
        rideId: ride._id,
        estimatedFare: ride.estimatedFare,
        estimatedDuration: ride.estimatedDuration
      });
      
      // Find nearby available drivers
      const nearbyDrivers = findNearbyDrivers(pickupLocation.coordinates, vehicleType);
      
      // Send ride request to nearby drivers
      nearbyDrivers.forEach(driver => {
        const driverSocket = activeDrivers.get(driver.userId);
        if (driverSocket) {
          io.to(driverSocket.socketId).emit('rideRequest', {
            rideId: ride._id,
            pickup: pickupLocation,
            dropoff: dropoffLocation,
            estimatedFare: ride.estimatedFare,
            passengerInfo: {
              name: ride.passenger.name,
              rating: ride.passenger.rating
            }
          });
        }
      });
      
      // Set timeout for ride request
      setTimeout(async () => {
        const currentRide = await Ride.findById(ride._id);
        if (currentRide && currentRide.status === 'requested') {
          currentRide.status = 'cancelled';
          currentRide.cancelledBy = 'system';
          currentRide.cancellationReason = 'No drivers available';
          await currentRide.save();
          
          socket.emit('rideTimeout', { rideId: ride._id });
          activeRides.delete(ride._id.toString());
        }
      }, 120000); // 2 minutes timeout
      
    } catch (error) {
      console.error('Error requesting ride:', error);
      socket.emit('rideError', { 
        error: 'Failed to request ride',
        details: error.message 
      });
    }
  });

  // Driver accepts ride
  socket.on('acceptRide', async (data) => {
    try {
      const { rideId } = data;
      
      if (!socket.userId) {
        socket.emit('rideError', { error: 'Not authenticated' });
        return;
      }
      
      const ride = await Ride.findById(rideId).populate('passenger', 'name phone avatar');
      if (!ride || ride.status !== 'requested') {
        socket.emit('rideError', { error: 'Ride not available' });
        return;
      }
      
      // Check if driver is available
      const driver = await User.findById(socket.userId);
      if (!driver.isAvailable || driver.role !== 'rider') {
        socket.emit('rideError', { error: 'Driver not available' });
        return;
      }
      
      // Assign driver to ride
      ride.driver = socket.userId;
      await ride.updateStatus('driver_assigned');
      
      // Generate OTP for ride verification
      await ride.generateOTP();
      
      // Make driver unavailable
      driver.isAvailable = false;
      await driver.save();
      activeDrivers.delete(socket.userId);
      
      // Notify passenger
      const rideConnection = activeRides.get(rideId);
      if (rideConnection) {
        io.to(rideConnection.socketId).emit('driverAssigned', {
          rideId: rideId,
          driver: {
            id: driver._id,
            name: driver.name,
            phone: driver.phone,
            avatar: driver.avatar,
            vehicle: driver.vehicle,
            rating: driver.rating,
            location: driver.location
          },
          otp: ride.otp
        });
      }
      
      // Confirm to driver
      socket.emit('rideAccepted', {
        rideId: rideId,
        passenger: ride.passenger,
        pickup: ride.pickupLocation,
        dropoff: ride.dropoffLocation,
        otp: ride.otp
      });
      
      // Create notifications
      await Notification.createNotification({
        recipient: ride.passenger._id,
        type: 'ride_driver_assigned',
        title: 'Driver Assigned',
        message: `${driver.name} will pick you up soon`,
        data: { rideId: rideId }
      });
      
    } catch (error) {
      console.error('Error accepting ride:', error);
      socket.emit('rideError', { 
        error: 'Failed to accept ride',
        details: error.message 
      });
    }
  });

  // Driver updates location during ride
  socket.on('updateLocation', async (data) => {
    try {
      const { rideId, location, speed, heading } = data;
      
      const ride = await Ride.findById(rideId);
      if (!ride || ride.driver.toString() !== socket.userId) {
        socket.emit('rideError', { error: 'Unauthorized' });
        return;
      }
      
      // Add route point
      await ride.addRoutePoint(location.coordinates, speed, heading);
      
      // Update driver location in database
      await User.findByIdAndUpdate(socket.userId, {
        'location.coordinates': location.coordinates,
        'location.address': location.address
      });
      
      // Send location update to passenger
      const rideConnection = activeRides.get(rideId);
      if (rideConnection) {
        io.to(rideConnection.socketId).emit('driverLocationUpdate', {
          rideId: rideId,
          location: location,
          speed: speed,
          heading: heading,
          timestamp: new Date()
        });
      }
      
    } catch (error) {
      console.error('Error updating location:', error);
      socket.emit('rideError', { 
        error: 'Failed to update location',
        details: error.message 
      });
    }
  });

  // Update ride status
  socket.on('updateRideStatus', async (data) => {
    try {
      const { rideId, status, otp } = data;
      
      const ride = await Ride.findById(rideId).populate('passenger driver');
      if (!ride) {
        socket.emit('rideError', { error: 'Ride not found' });
        return;
      }
      
      // Verify user can update this ride
      const userId = socket.userId;
      if (ride.passenger._id.toString() !== userId && ride.driver._id.toString() !== userId) {
        socket.emit('rideError', { error: 'Unauthorized' });
        return;
      }
      
      // Verify OTP for trip start
      if (status === 'in_progress' && otp) {
        if (!ride.verifyOTP(otp)) {
          socket.emit('rideError', { error: 'Invalid OTP' });
          return;
        }
      }
      
      // Update ride status
      await ride.updateStatus(status);
      
      // Handle specific status updates
      if (status === 'completed') {
        // Calculate final fare
        ride.calculateFare();
        await ride.save();
        
        // Make driver available again
        if (ride.driver) {
          await User.findByIdAndUpdate(ride.driver._id, { isAvailable: true });
        }
        
        activeRides.delete(rideId);
      }
      
      // Notify both parties
      const passengerConnection = activeRides.get(rideId);
      const driverConnection = activeDrivers.get(ride.driver._id.toString());
      
      const statusUpdate = {
        rideId: rideId,
        status: status,
        timestamp: new Date()
      };
      
      if (passengerConnection && ride.passenger._id.toString() !== userId) {
        io.to(passengerConnection.socketId).emit('rideStatusUpdate', statusUpdate);
      }
      
      if (driverConnection && ride.driver._id.toString() !== userId) {
        io.to(driverConnection.socketId).emit('rideStatusUpdate', statusUpdate);
      }
      
      socket.emit('rideStatusUpdated', statusUpdate);
      
      // Create notification
      const recipient = userId === ride.passenger._id.toString() ? 
                       ride.driver._id : ride.passenger._id;
      
      await Notification.createNotification({
        recipient: recipient,
        type: `ride_${status}`,
        title: `Ride ${status.replace('_', ' ')}`,
        message: `Your ride has been ${status.replace('_', ' ')}`,
        data: { rideId: rideId }
      });
      
    } catch (error) {
      console.error('Error updating ride status:', error);
      socket.emit('rideError', { 
        error: 'Failed to update ride status',
        details: error.message 
      });
    }
  });

  // Cancel ride
  socket.on('cancelRide', async (data) => {
    try {
      const { rideId, reason } = data;
      
      const ride = await Ride.findById(rideId).populate('passenger driver');
      if (!ride) {
        socket.emit('rideError', { error: 'Ride not found' });
        return;
      }
      
      const userId = socket.userId;
      const isPassenger = ride.passenger._id.toString() === userId;
      const isDriver = ride.driver && ride.driver._id.toString() === userId;
      
      if (!isPassenger && !isDriver) {
        socket.emit('rideError', { error: 'Unauthorized' });
        return;
      }
      
      // Update ride
      ride.status = 'cancelled';
      ride.cancelledBy = isPassenger ? 'passenger' : 'driver';
      ride.cancellationReason = reason;
      ride.cancelledAt = new Date();
      
      // Calculate cancellation fee if applicable
      if (ride.status === 'driver_assigned' || ride.status === 'driver_arrived') {
        ride.cancellationFee = 2.00; // Example fee
      }
      
      await ride.save();
      
      // Make driver available again
      if (ride.driver) {
        await User.findByIdAndUpdate(ride.driver._id, { isAvailable: true });
      }
      
      // Notify other party
      const otherUserId = isPassenger ? ride.driver._id.toString() : ride.passenger._id.toString();
      const otherConnection = isPassenger ? 
                             activeDrivers.get(otherUserId) : 
                             activeRides.get(rideId);
      
      if (otherConnection) {
        const socketId = otherConnection.socketId || otherConnection;
        io.to(socketId).emit('rideCancelled', {
          rideId: rideId,
          cancelledBy: ride.cancelledBy,
          reason: reason,
          cancellationFee: ride.cancellationFee
        });
      }
      
      socket.emit('rideCancelled', {
        rideId: rideId,
        cancelledBy: ride.cancelledBy,
        reason: reason
      });
      
      activeRides.delete(rideId);
      
    } catch (error) {
      console.error('Error cancelling ride:', error);
      socket.emit('rideError', { 
        error: 'Failed to cancel ride',
        details: error.message 
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      activeDrivers.delete(socket.userId);
      
      // Find and clean up any active rides for this user
      for (const [rideId, connection] of activeRides.entries()) {
        if (connection.socketId === socket.id) {
          activeRides.delete(rideId);
          break;
        }
      }
      
      console.log(`User ${socket.userId} disconnected from ride tracking`);
    }
  });
};

// Helper function to calculate distance between two points
function calculateDistance(coords1, coords2) {
  const [lat1, lon1] = coords1;
  const [lat2, lon2] = coords2;
  
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Helper function to find nearby drivers
function findNearbyDrivers(passengerLocation, vehicleType, radius = 5) {
  const nearbyDrivers = [];
  
  for (const [driverId, driverData] of activeDrivers.entries()) {
    if (vehicleType && driverData.vehicle !== vehicleType) continue;
    
    const distance = calculateDistance(
      passengerLocation,
      driverData.location.coordinates
    );
    
    if (distance <= radius) {
      nearbyDrivers.push({
        userId: driverId,
        distance: distance,
        ...driverData
      });
    }
  }
  
  // Sort by distance
  return nearbyDrivers.sort((a, b) => a.distance - b.distance);
}

module.exports = rideSocket;