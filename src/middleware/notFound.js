function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        error: `Cannot ${req.method} ${req.url} - Endpoint not found.`
    });
}

module.exports = notFoundHandler;
