import { Socket } from 'socket.io-client';

/**
 * Attaches a debugger to a socket instance that logs all events
 * Useful for troubleshooting socket communication issues
 */
export function attachSocketDebugger(socket: Socket) {
  const originalEmit = socket.emit;
  const originalOn = socket.on;

  // Override emit to log outgoing events
  socket.emit = function (event: string, ...args: any[]) {
    console.log(`🔸 [Socket.emit] Event: ${event}`, args.length > 0 ? args[0] : '');
    return originalEmit.apply(socket, [event, ...args]);
  };

  // Override on to log incoming events
  socket.on = function (event: string, callback: any) {
    const wrappedCallback = (...args: any[]) => {
      console.log(`🔹 [Socket.on] Event: ${event}`, args.length > 0 ? args[0] : '');
      return callback.apply(this, args);
    };
    return originalOn.apply(socket, [event, wrappedCallback]);
  };

  console.log('🔍 [Socket Debugger] Attached - all socket events will be logged');

  return socket;
}
