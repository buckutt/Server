export default function cors (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'accept, content-type');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'device,point');

    next();
}