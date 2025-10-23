module.exports = async function (context, req) {
    context.log('TEST ENDPOINT CALLED');
    context.log('Method:', req.method);
    context.log('Headers:', JSON.stringify(req.headers));
    context.log('Body:', JSON.stringify(req.body));
    
    context.res = {
        status: 200,
        body: {
            message: "Test endpoint working",
            timestamp: new Date().toISOString(),
            method: req.method,
            hasBody: !!req.body
        }
    };
};
