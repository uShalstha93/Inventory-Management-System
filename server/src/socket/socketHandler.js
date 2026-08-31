export const setupSocketHandlers = (io) => {
    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        socket.on('join-dashboard', () => {
            socket.join('dashboard');
        });

        socket.on('new-purchase', (data) => {
            io.to('dashboard').emit('purchase-update', data);
        });

        socket.on('new-sale', (data) => {
            io.to('dashboard').emit('sale-update', data);
        });

        socket.on('stock-update', (data) => {
            io.to('dashboard').emit('stock-change', data);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
};