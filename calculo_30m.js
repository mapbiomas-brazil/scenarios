// Calculo do uso do solo futuro em funcao do cenario entregue ao modelo

/* Início do passo 1: cálculo das probabilidades */
// Variaveis: theta1 = preditor linear da classe de pastagem; theta2 = preditor linear da classe de agricultura
//    prob_vn = probabilidade de VN; prob_pas = probabilidade de PAS; prob_agr = probabilidade de AGR

//Carrega os assets e valores assumidos constantes:
//Assets: mascara (limite estadual) [mask], biofísico [bioft]; spline multivariada espacial [sp]
//Constantes: interceptos [i1, i2]; ano de referencia: 2019; anos do modelo [anos]; coeficientes de expansao pecuaria [pec]; coeficientes de expansao agricola [agr];
var mask, estados;
mask = estados = ee.Image('projects/mapbiomas-workspace/AUXILIAR/estados-2016-raster');
var bioft1 = ee.Image('projects/mapbiomas-workspace/CENARIOS/biofisico/pred_2017_bioft1_all').divide(10000).updateMask(mask);
var spt1 = ee.Image('projects/mapbiomas-workspace/CENARIOS/spline/pred_2017_spt1_all').divide(10000).updateMask(mask);
var bioft2 = ee.Image('projects/mapbiomas-workspace/CENARIOS/biofisico/pred_2017_bioft2_all').divide(10000).updateMask(mask);
var spt2 = ee.Image('projects/mapbiomas-workspace/CENARIOS/spline/pred_2017_spt2_all').divide(10000).updateMask(mask);
var i1 = -3.876646720;
var i2 = -3.656398079;
var ano_ref = 2019;

var anos = [2025, 2030, 2035];
var pec = [0.04833552, -0.02645261, -0.10124075];
var agr = [0.5388876, 0.6514327, 0.7639777];

//Carrega os rasters em funcao do cenario
//'S1' se refere ao estado 'agressivo' da variável
//'S2', ao estado intermediario
//'S3', ao estado menos agressivo
var str_ucs = 'S1';
var str_cli = 'S1';
var str_rod = 'S1';
var str_uhe = 'S1';
var str_urb = 'S1';
var str_ano = 2025;
//Daqui em diante, o calculo é identico e varia em funcao destas strings acima

//Varia ligeiramente a taxa de conversao a partir do cenario
var tax_c1 = 1;
var tax_c2 = 1;
//Para cada status S1, +2.0% em [vn2pas,vn2agr,pas2agr], -2.0% em [agr2vn,pas2vn,agr2pas]
//Para cada status S2, +1.0% em [vn2pas,vn2agr,pas2agr], -1.0% em [agr2vn,pas2vn,agr2pas]
//Status S3 nao alteram a taxa
var cen = [str_ucs, str_cli, str_rod, str_uhe, str_urb];
cen.map(function(i){
  if(i == 'S1'){
    tax_c1 += 2/100;
    tax_c2 -= 2/100;
  } else if(i == 'S2'){
    tax_c1 += 1/100;
    tax_c2 -= 1/100;
  }
});

//Carrega os assets a partir do cenario futuro definido acima
//Unidades de conservacao
if(str_ucs == 'S1'){
  var ucst1 = ee.Image(0).updateMask(mask);
  var ucst2 = ee.Image(0).updateMask(mask);
} else {
  var ucst1 = ee.Image('projects/mapbiomas-workspace/CENARIOS/unidade-conservacao/pred_uc_' + str_ucs + '_t1').divide(10000).updateMask(mask);
  var ucst2 = ee.Image('projects/mapbiomas-workspace/CENARIOS/unidade-conservacao/pred_uc_' + str_ucs + '_t2').divide(10000).updateMask(mask);
}
//Rodovias
var rod1 = ee.Image('projects/mapbiomas-workspace/CENARIOS/transporte/pred_transp_' + str_rod + '_t1').divide(10000).updateMask(mask);
var rod2 = ee.Image('projects/mapbiomas-workspace/CENARIOS/transporte/pred_transp_' + str_rod + '_t2').divide(10000).updateMask(mask);
//Hidreletricas
var uhe1 = ee.Image('projects/mapbiomas-workspace/CENARIOS/hidreletricas/pred_uhe_' + str_uhe + '_t1').divide(10000).updateMask(mask);
var uhe2 = ee.Image('projects/mapbiomas-workspace/CENARIOS/hidreletricas/pred_uhe_' + str_uhe + '_t2').divide(10000).updateMask(mask);
//Clima
var cli_RCP45med_t1 = ee.Image('projects/mapbiomas-workspace/CENARIOS/temperatura/pred_tmmx_RCP45med_t1');
var cli_RCP45med_t2 = ee.Image('projects/mapbiomas-workspace/CENARIOS/temperatura/pred_tmmx_RCP45med_t2');
var cli_RCP45q90_t1 = ee.Image('projects/mapbiomas-workspace/CENARIOS/temperatura/pred_tmmx_RCP45q90_t1');
var cli_RCP45q90_t2 = ee.Image('projects/mapbiomas-workspace/CENARIOS/temperatura/pred_tmmx_RCP45q90_t2');
var cli_RCP85med_t1 = ee.Image('projects/mapbiomas-workspace/CENARIOS/temperatura/pred_tmmx_RCP85med_t1');
var cli_RCP85med_t2 = ee.Image('projects/mapbiomas-workspace/CENARIOS/temperatura/pred_tmmx_RCP85med_t2');
var cli_RCP85q90_t1 = ee.Image('projects/mapbiomas-workspace/CENARIOS/temperatura/pred_tmmx_RCP85q90_t1');
var cli_RCP85q90_t2 = ee.Image('projects/mapbiomas-workspace/CENARIOS/temperatura/pred_tmmx_RCP85q90_t2');
if(str_cli == 'S1'){
  if(str_ano == 2025){
    var cli1 = cli_RCP85med_t1;
    var cli2 = cli_RCP85med_t2;
  } else if(str_ano == 2030){
    var cli1 = cli_RCP85med_t1.add(cli_RCP85q90_t1).divide(2);
    var cli2 = cli_RCP85med_t2.add(cli_RCP85q90_t2).divide(2);
  } else if(str_ano == 2035){
    var cli1 = cli_RCP85q90_t1;
    var cli2 = cli_RCP85q90_t2;
  }
} else if(str_cli == 'S2'){
  if(str_ano == 2025){
    var cli1 = cli_RCP85med_t1.add(cli_RCP45med_t1).divide(2);
    var cli2 = cli_RCP85med_t2.add(cli_RCP45med_t2).divide(2);
  } else if(str_ano == 2030){
    var cli1 = cli_RCP85med_t1.add(cli_RCP85q90_t1).add(cli_RCP45med_t1).add(cli_RCP45q90_t1).divide(4);
    var cli2 = cli_RCP85med_t2.add(cli_RCP85q90_t2).add(cli_RCP45med_t2).add(cli_RCP45q90_t2).divide(4);
  }else if(str_ano == 2035){
    var cli1 = cli_RCP85q90_t1.add(cli_RCP45q90_t1).divide(2);
    var cli2 = cli_RCP85q90_t2.add(cli_RCP45q90_t2).divide(2);
  }
} else if(str_cli == 'S3'){
  if(str_ano == 2025){
    var cli1 = cli_RCP45med_t1;
    var cli2 = cli_RCP45med_t2;
  } else if(str_ano == 2030){
    var cli1 = cli_RCP45med_t1.add(cli_RCP45q90_t1).divide(2);
    var cli2 = cli_RCP45med_t2.add(cli_RCP45q90_t2).divide(2);
  } else if(str_ano == 2035){
    var cli1 = cli_RCP45q90_t1;
    var cli2 = cli_RCP45q90_t2;
  }
}
cli1 = cli1.divide(10000).updateMask(mask);
cli2 = cli2.divide(10000).updateMask(mask);

//Expansao urbana
var urb_S1_2025_t1 = ee.Image('projects/mapbiomas-workspace/CENARIOS/urbano/pred_urb_2pc2025_t1');
var urb_S1_2025_t2 = ee.Image('projects/mapbiomas-workspace/CENARIOS/urbano/pred_urb_2pc2025_t2');
var urb_S1_2030_t1 = ee.Image('projects/mapbiomas-workspace/CENARIOS/urbano/pred_urb_2pc2030_t1');
var urb_S1_2030_t2 = ee.Image('projects/mapbiomas-workspace/CENARIOS/urbano/pred_urb_2pc2030_t2');
var urb_S1_2035_t1 = ee.Image('projects/mapbiomas-workspace/CENARIOS/urbano/pred_urb_2pc2035_t1');
var urb_S1_2035_t2 = ee.Image('projects/mapbiomas-workspace/CENARIOS/urbano/pred_urb_2pc2035_t2');
var urb_S3_2025_t1 = ee.Image('projects/mapbiomas-workspace/CENARIOS/urbano/pred_urb_1_5pc2025_t1');
var urb_S3_2025_t2 = ee.Image('projects/mapbiomas-workspace/CENARIOS/urbano/pred_urb_1_5pc2025_t2');
var urb_S3_2030_t1 = ee.Image('projects/mapbiomas-workspace/CENARIOS/urbano/pred_urb_1_5pc2030_t1');
var urb_S3_2030_t2 = ee.Image('projects/mapbiomas-workspace/CENARIOS/urbano/pred_urb_1_5pc2030_t2');
var urb_S3_2035_t1 = ee.Image('projects/mapbiomas-workspace/CENARIOS/urbano/pred_urb_1_5pc2035_t1');
var urb_S3_2035_t2 = ee.Image('projects/mapbiomas-workspace/CENARIOS/urbano/pred_urb_1_5pc2035_t2');
if(str_urb == 'S1'){
  if(str_ano == 2025){
    var urb1 = urb_S1_2025_t1;
    var urb2 = urb_S1_2025_t2;
  } else if(str_ano == 2030){
    var urb1 = urb_S1_2030_t1;
    var urb2 = urb_S1_2030_t2;
  } else if(str_ano == 2035){
    var urb1 = urb_S1_2035_t1;
    var urb2 = urb_S1_2035_t2;
  }
} else if(str_urb == 'S2'){
  if(str_ano == 2025){
    var urb1 = urb_S1_2025_t1.add(urb_S3_2025_t1).divide(2);
    var urb2 = urb_S1_2025_t2.add(urb_S3_2025_t2).divide(2);
  } else if(str_ano == 2030){
    var urb1 = urb_S1_2030_t1.add(urb_S3_2030_t1).divide(2);
    var urb2 = urb_S1_2030_t2.add(urb_S3_2030_t2).divide(2);
  } else if(str_ano == 2035){
    var urb1 = urb_S1_2035_t1.add(urb_S3_2035_t1).divide(2);
    var urb2 = urb_S1_2035_t2.add(urb_S3_2035_t2).divide(2);
  }
} else if(str_urb == 'S3'){
  if(str_ano == 2025){
    var urb1 = urb_S3_2025_t1;
    var urb2 = urb_S3_2025_t2;
  } else if(str_ano == 2030){
    var urb1 = urb_S3_2030_t1;
    var urb2 = urb_S3_2030_t2;
  } else if(str_ano == 2035){
    var urb1 = urb_S3_2035_t1;
    var urb2 = urb_S3_2035_t2;
  }
}
urb1 = urb1.divide(10000).updateMask(mask);
urb2 = urb2.divide(10000).updateMask(mask);

//Carrega a constante de extrapolacao temporal
var tem1 = pec[anos.indexOf(str_ano)];
var tem2 = agr[anos.indexOf(str_ano)];

//Calcula os preditores lineares theta1 e theta2
var theta1 = spt1.add(i1).add(bioft1).add(cli1).add(ucst1).add(rod1).add(uhe1).add(urb1);
var theta2 = spt2.add(i2).add(bioft2).add(cli2).add(ucst2).add(rod2).add(uhe2).add(urb2);

//Calcula as probabilidades de VN, PAS e AGR
var prob_pas = theta1.exp().divide((theta1.exp().add(1).add(theta2.exp())));
var prob_agr = theta2.exp().divide((theta1.exp().add(1).add(theta2.exp())));
var prob_vn = prob_pas.add(prob_agr).subtract(1).multiply(-1);

//var probs = prob_vn;
//probs = probs.addBands(prob_pas);
//probs = probs.addBands(prob_agr);
//Map.addLayer(probs)

//Calcula as probabilidades condicionais, prob_<uso1>2<uso2> = P(<uso2> | ¬ <uso3>)
//Esses valores serão posteriormente filtrados pelo uso atual
//p.ex.: prob_<uso1>2<uso2> aparecerá apenas onde uso_atual = <uso1>
var prob_agr2pas = prob_pas.divide(prob_pas.add(prob_agr));
var prob_pas2agr = prob_agr.divide(prob_pas.add(prob_agr));
var prob_vn2pas = prob_pas.divide(prob_pas.add(prob_vn));
var prob_pas2vn = prob_vn.divide(prob_pas.add(prob_vn));
var prob_vn2agr = prob_agr.divide(prob_agr.add(prob_vn));
var prob_agr2vn = prob_vn.divide(prob_agr.add(prob_vn));
/* Fim do passo 1: cálculo das probabilidades */

/* Início do passo 2: desagregação do cenário econômico projetado */

//Carrega o uso do solo futuro [uso_pred] e 2019 [uso_ref]
var mapb = ee.ImageCollection("projects/mapbiomas-workspace/COLECAO5/mapbiomas-collection50-integration-v8").mosaic().select('classification_' + ano_ref);
mapb = mapb.remap(
	[3, 4, 5, 11, 12, 9, 19, 39, 20, 40, 41, 42, 43, 44, 45, 36, 21, 15],
	[0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1]
);

var uso_pred, uso_ref;
uso_pred = mapb;
uso_ref = mapb;

//Carrega as variações na cobertura do solo por estado, medias anuais desde 2010
//Formato: agr2pas, agr2vn, pas2agr, pas2vn, vn2agr, vn2pas
var ests = [11, 12, 13, 14, 15, 16, 17, 21, 22, 23, 24, 25, 26, 27, 28, 29, 31, 32, 33, 35, 41, 42, 43, 50, 51, 52, 53]
var meds = [[2173.82, 641.12, 19136.01, 42351.81, 3410.18, 157418.63],
[0, 0, 0, 18013.56, 0, 50507.69],
[55.25, 36.56, 114.81, 55255.37, 185.78, 136312.33],
[42.97, 488.53, 31.1, 13544.89, 4388.22, 43863.82],
[1367.48, 788.44, 35958.29, 272126.41, 12806.48, 527619.22],
[47.21, 835.6, 111.68, 5768, 4077.39, 10187.26],
[4711, 952.66, 37509.94, 89415.44, 32043.43, 254356.36],
[1010.91, 2223.05, 11679.41, 120238.2, 43926.88, 315480.43],
[3794.1, 1512.64, 9344.28, 59983.99, 71256.1, 70523.43],
[2209.07, 1443.75, 14344.24, 68120.87, 6088.56, 74289.05],
[2934.74, 760.19, 6690.78, 5363.55, 3354.28, 25195.77],
[992.83, 10.58, 2687.04, 20509.1, 189.16, 48063.82],
[2027.79, 94.21, 6694.89, 33723.38, 461.72, 67284.4],
[2506.41, 240.35, 8140.33, 15694.07, 296.99, 5189.12],
[169.12, 3.49, 3828.55, 14068.59, 95.3, 4364.49],
[9851.84, 3654.84, 55035.68, 223908.7, 71617.81, 247732.45],
[24531.73, 8092.54, 176331.68, 145171.32, 56764.03, 284159.07],
[724.47, 552.15, 32462.25, 4456.34, 1804.39, 3238.37],
[606.82, 59.21, 4672.49, 3599.25, 235.05, 1449.51],
[38146.09, 11624.52, 183613.03, 22972.45, 41344.59, 13910.78],
[19827.21, 6446.32, 76483.92, 18539.28, 25146.39, 8446.53],
[7208.52, 3795.07, 14922.82, 9534.6, 25823.52, 8873.32],
[6270.15, 66597.39, 18591.71, 8508.51, 216897.57, 9070.36],
[15680.96, 1172.37, 203130.5, 110558.36, 12857.48, 142344.86],
[52381.83, 10958.1, 347992.65, 191591, 95239.48, 472831.28],
[24778.62, 1524.61, 198002.14, 109510.92, 15980.24, 219638.62],
[291.98, 42.49, 2091.68, 1593, 440.85, 3129.05]];

var idx = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26];

//vn2pas
var loc_vn2pas = ee.ImageCollection.fromImages(idx.map(function(id){
  var prob_it = prob_vn2pas.updateMask(estados.eq(ests[id])).updateMask(uso_ref.eq(0));
  var area_vn2pas = meds[id][5] * (str_ano - ano_ref) * tax_c1;
  var area_tot = prob_it.gte(0).multiply(ee.Image.pixelArea()).divide(10000).reduceRegion({
    reducer: ee.Reducer.sum(),
    bestEffort: true
  });
  var p = ee.Number(area_vn2pas).divide(ee.Number(area_tot.get('b1'))).multiply(100);
  p = (p.subtract(100)).multiply(-1).max(0);
  p = prob_it.reduceRegion({
    reducer: ee.Reducer.percentile([p]),
    bestEffort: true
  });
  p = p.get('b1');
  p = ee.Algorithms.If(ee.Number(p), ee.Number(p), 1);
  return prob_it.gte(ee.Number(p));
}));

//vn2agr
var loc_vn2agr = ee.ImageCollection.fromImages(idx.map(function(id){
  var prob_it = prob_vn2agr.updateMask(estados.eq(ests[id])).updateMask(uso_ref.eq(0));
  var area_vn2agr = meds[id][4] * (str_ano - ano_ref) * tax_c1;
  var area_tot = prob_it.gte(0).multiply(ee.Image.pixelArea()).divide(10000).reduceRegion({
    reducer: ee.Reducer.sum(),
    bestEffort: true
  });
  var p = ee.Number(area_vn2agr).divide(ee.Number(area_tot.get('b1'))).multiply(100);
  p = (p.subtract(100)).multiply(-1).max(0);
  p = prob_it.reduceRegion({
    reducer: ee.Reducer.percentile([p]),
    bestEffort: true
  });
  p = p.get('b1');
  p = ee.Algorithms.If(ee.Number(p), ee.Number(p), 1);
  return prob_it.gte(ee.Number(p));
}));

//pas2vn
var loc_pas2vn = ee.ImageCollection.fromImages(idx.map(function(id){
  var prob_it = prob_pas2vn.updateMask(estados.eq(ests[id])).updateMask(uso_ref.eq(1));
  var area_pas2vn = meds[id][3] * (str_ano - ano_ref) * tax_c2;
  var area_tot = prob_it.gte(0).multiply(ee.Image.pixelArea()).divide(10000).reduceRegion({
    reducer: ee.Reducer.sum(),
    bestEffort: true
  });
  var p = ee.Number(area_pas2vn).divide(ee.Number(area_tot.get('b1'))).multiply(100);
  p = (p.subtract(100)).multiply(-1).max(0);
  p = prob_it.reduceRegion({
    reducer: ee.Reducer.percentile([p]),
    bestEffort: true
  });
  p = p.get('b1');
  p = ee.Algorithms.If(ee.Number(p), ee.Number(p), 1);
  return prob_it.gte(ee.Number(p));
}));

//pas2agr
var loc_pas2agr = ee.ImageCollection.fromImages(idx.map(function(id){
  var prob_it = prob_pas2agr.updateMask(estados.eq(ests[id])).updateMask(uso_ref.eq(1));
  var area_pas2agr = meds[id][2] * (str_ano - ano_ref) * tax_c1;
  var area_tot = prob_it.gte(0).multiply(ee.Image.pixelArea()).divide(10000).reduceRegion({
    reducer: ee.Reducer.sum(),
    bestEffort: true
  });
  var p = ee.Number(area_pas2agr).divide(ee.Number(area_tot.get('b1'))).multiply(100);
  p = (p.subtract(100)).multiply(-1).max(0);
  p = prob_it.reduceRegion({
    reducer: ee.Reducer.percentile([p]),
    bestEffort: true
  });
  p = p.get('b1');
  p = ee.Algorithms.If(ee.Number(p), ee.Number(p), 1);
  return prob_it.gte(ee.Number(p));
}));

//agr2vn
var loc_agr2vn = ee.ImageCollection.fromImages(idx.map(function(id){
  var prob_it = prob_agr2vn.updateMask(estados.eq(ests[id])).updateMask(uso_ref.eq(2));
  var area_agr2vn = meds[id][1] * (str_ano - ano_ref) * tax_c2;
  var area_tot = prob_it.gte(0).multiply(ee.Image.pixelArea()).divide(10000).reduceRegion({
    reducer: ee.Reducer.sum(),
    bestEffort: true
  });
  var p = ee.Number(area_agr2vn).divide(ee.Number(area_tot.get('b1'))).multiply(100);
  p = (p.subtract(100)).multiply(-1).max(0);
  p = prob_it.reduceRegion({
    reducer: ee.Reducer.percentile([p]),
    bestEffort: true
  });
  p = p.get('b1');
  p = ee.Algorithms.If(ee.Number(p), ee.Number(p), 1);
  return prob_it.gte(ee.Number(p));
}));

//agr2pas
var loc_agr2pas = ee.ImageCollection.fromImages(idx.map(function(id){
  var prob_it = prob_agr2pas.updateMask(estados.eq(ests[id])).updateMask(uso_ref.eq(2));
  var area_agr2pas = meds[id][0] * (str_ano - ano_ref) * tax_c2;
  var area_tot = prob_it.gte(0).multiply(ee.Image.pixelArea()).divide(10000).reduceRegion({
    reducer: ee.Reducer.sum(),
    bestEffort: true
  });
  var p = ee.Number(area_agr2pas).divide(ee.Number(area_tot.get('b1'))).multiply(100);
  p = (p.subtract(100)).multiply(-1).max(0);
  p = prob_it.reduceRegion({
    reducer: ee.Reducer.percentile([p]),
    bestEffort: true
  });
  p = p.get('b1');
  p = ee.Algorithms.If(ee.Number(p), ee.Number(p), 1);
  return prob_it.gte(ee.Number(p));
}));

loc_vn2pas = loc_vn2pas.reduce(ee.Reducer.sum());
loc_vn2agr = loc_vn2agr.reduce(ee.Reducer.sum());
loc_pas2vn = loc_pas2vn.reduce(ee.Reducer.sum());
loc_pas2agr = loc_pas2agr.reduce(ee.Reducer.sum());
loc_agr2vn = loc_agr2vn.reduce(ee.Reducer.sum());
loc_agr2pas = loc_agr2pas.reduce(ee.Reducer.sum());

uso_pred = uso_pred.where(loc_vn2pas.eq(1), 1);
uso_pred = uso_pred.where(loc_vn2agr.eq(1), 2);
uso_pred = uso_pred.where(loc_pas2vn.eq(1), 0);
uso_pred = uso_pred.where(loc_pas2agr.eq(1), 2);
uso_pred = uso_pred.where(loc_agr2vn.eq(1), 0);
uso_pred = uso_pred.where(loc_agr2pas.eq(1), 1);

Export.image.toAsset({
  image: uso_pred,
  description: 'Pred' + str_ano + '-UCs' + str_ucs + '-Cli' + str_cli + '-Rod' + str_rod + '-UHE' + str_uhe + '-Urb' + str_urb,
  assetId:'projects/mapbiomas-workspace/CENARIOS/predicao/Pred' + str_ano + '-UCs' + str_ucs + '-Cli' + str_cli + '-Rod' + str_rod + '-UHE' + str_uhe + '-Urb' + str_urb,
  scale: 30,
  pyramidingPolicy: {
    '.default': 'mode'
  },
  region: mask.geometry(),
  maxPixels: 1e13
});
