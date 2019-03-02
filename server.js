var express = require('express');
var app = express();
var request = require("request");
var bodyParser = require("body-parser");
var pug = require('pug');
var fs = require('fs');

var obj = JSON.parse(fs.readFileSync('Assets/departments.json','utf8'));

var TccEndPoint = "https://tccrestify-dot-tcc-cloud.appspot.com/";
var Token = 'D0582E1C-BF22-413B-BA65-A3712F38B399';

var onlyUnique = (value, index, self)=>{
    return self.indexOf(value) === index;
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.set('view engine','pug');

app.post('/municipios',(req,res)=>{
    console.log(req.body.CodigoMunicipio);

    var items = obj.filter((item)=>{
        return item.CodigoMunicipio == req.body.CodigoMunicipio
    });

    res.send(items);
});

app.post('/departments',(req,res)=>{

    var items = Array.from(new Set(obj.map(s => s.Departamento)))
    .map(Departamento => {
        return {
            name : Departamento,
            id: obj.find(s => s.Departamento === Departamento).CodigoMunicipio
        };
    });

    res.send(items);
});

app.post('/cities', (req, res) => {

    var options = {
        method: 'POST',
        url: TccEndPoint + '/master/checkcitiesod',
        headers:
        {
            'cache-control': 'no-cache',
            'Content-Type': 'application/json'
        },
        body: { opcion: 2 },
        json: true
    };

    if (req.get('Token') === Token) {
        request(options, function (error, response, body) {
            if (error) throw new Error(error);

            res.send(body);
        });
    } else {
        res.send({
            error: 'Token invalid'
        });
    }


});

app.post('/cotization', (req, res) => {

    var body = {
        Clave: 'SITIO_WEB',
        Liquidacion:
        {
            idciudadorigen: '1',
            idciudaddestino: '1',
            valormercancia: 30000,
            fecharemesa: '2019-02-20',
            idunidadestrategicanegocio: '',
            unidades:
                [{
                    unidad:
                    {
                        numerounidades: '1',
                        pesoreal: '4',
                        pesovolumen: '',
                        alto: '30',
                        largo: '20',
                        ancho: '20',
                        valor: '30000'
                    }
                }]
        }
    };

    var options = {
        method: 'POST',
        url: TccEndPoint + '/cotizarenvio/liquidacion',
        headers:
        {
            'cache-control': 'no-cache',
            'Content-Type': 'application/json'
        },
        body: body
        ,
        json: true
    };

    if (req.get("Token") === Token) {
        request(options, function (error, response, body) {
            if (error) throw new Error(error);

            res.send(body.consultarliquidacionResult.total);
        });
    } else {
        res.send({
            error: 'Token invalid'
        });
    }


})

app.get('/', (req, res) => {
    var data = [{
        name:'BOGOTA - CUNDINAMARCA',
        value:'4'
    },{
        name:'BOJACA - CUNDINAMARCA',
        value:'60'
    }];

    var options = {
        method: 'POST',
        url: TccEndPoint + '/master/checkcitiesod',
        headers:
        {
            'cache-control': 'no-cache',
            'Content-Type': 'application/json'
        },
        body: { opcion: 2 },
        json: true
    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);

        res.render('index', { cities:body.ciudades.ciudad});
    });

    
});

app.get('/process', (req, res) => {

    var body = {
        Clave: 'SITIO_WEB',
        Liquidacion:
        {
            idciudadorigen: '1',
            idciudaddestino: req.param('CityDest',null),
            valormercancia: 30000,
            fecharemesa: '2019-02-20',
            idunidadestrategicanegocio: '',
            unidades:
                [{
                    unidad:
                    {
                        numerounidades: '1',
                        pesoreal: '3',
                        pesovolumen: '',
                        alto: '20',
                        largo: '10',
                        ancho: '10',
                        valor: '30000'
                    }
                }]
        }
    };

    var options = {
        method: 'POST',
        url: TccEndPoint + '/cotizarenvio/liquidacion',
        headers:
        {
            'cache-control': 'no-cache',
            'Content-Type': 'application/json'
        },
        body: body
        ,
        json: true
    };

        request(options, function (error, response, body) {
            if (error) throw new Error(error);

            console.log(body.consultarliquidacionResult.total.totaldespacho);

            res.render('cotization', { TotalValor:body.consultarliquidacionResult.total.totaldespacho });
            return ;
        });
    
});

app.listen(process.env.port | 8080, () => {
    console.log("listen in the port 8080");
});

