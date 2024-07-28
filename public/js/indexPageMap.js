maptilersdk.config.apiKey = mapToken;

//display map
const map = new maptilersdk.Map({
    container: 'cluster-map', // container's id or the HTML element in which SDK will render the map
    style: maptilersdk.MapStyle.DATAVIZ.LIGHT,
    center: [-98.84, 38.28], // starting position [lng, lat]
    zoom: 3 //zoom值越小放大越少，即map区域越大
  });


console.log(campgrounds)  
/*
map.on('load', async function () {
    await maptilersdk.helpers.addPoint(map, {
      //data: 'https://docs.maptiler.com/sdk-js/assets/schools.geojson',
    data: campgrounds,
      cluster: true,
    });
  });
*/

//schools.geojson 格式 key:value 
//其中key "features": [array], 这个array中元素格式如下
/*
{
    "type": "Feature",
    "properties": {
        "students": 908,
        "name": "Albertville Middle School"
    },
    "geometry": {
        "type": "Point",
        "coordinates": [-86.2062,34.2602]
    }
}
*/
//只要把JSON化的campgrounds作为features的值即可（已在index.ejs处理），campgrounds就是一个campground元素的array
//并且，因为cluster的popup是取properties这个key中的值，而当前的campground没有这个属性，
//所以给campground添加一个virtual property表示properties这个属性



map.on('load', function () {
    map.addSource('campgrounds', {
        type: 'geojson',
        data: campgrounds,
        cluster: true,
        clusterMaxZoom: 14, // Max zoom to cluster points on
        clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
    });

    map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'campgrounds',
        filter: ['has', 'point_count'],
        paint: {
            // Use step expressions (https://docs.maptiler.com/gl-style-specification/expressions/#step)
            // with three steps to implement three types of circles:
            // 根据每个cluster中的point_count大小显示不同颜色
            'circle-color': [
                'step',
                ['get', 'point_count'],
                '#00BCD4',
                10,
                '#2196F3',
                30,
                '#3F51B5'
            ],
            //根据每个cluster中的点的数量来动态调整圆的半径
            'circle-radius': [
                'step', // 使用 'step' 分段表达式
                ['get', 'point_count'], // 'get' 是一个表达式，获取 'point_count' 属性值
                15, // 默认半径，如果没有匹配到任何后续的分段值
                10, // 第一个分段阈值
                20, // 当 'point_count' >= 10 时的半径
                30, // 第二个分段阈值
                25  // 当 'point_count' >= 30 时的半径
            ]
        }
    });

    map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'campgrounds',
        filter: ['has', 'point_count'],
        layout: {
            'text-field': '{point_count_abbreviated}', //diaplay the text of how many points are clustered into one
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
        }
    });

    map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'campgrounds',
        filter: ['!', ['has', 'point_count']],
        paint: {
            'circle-color': '#11b4da',
            'circle-radius': 4,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff'
        }
    });

    // inspect a cluster on click
    map.on('click', 'clusters', async (e) => {
        const features = map.queryRenderedFeatures(e.point, {
            layers: ['clusters']
        });
        const clusterId = features[0].properties.cluster_id;
        const zoom = await map.getSource('campgrounds').getClusterExpansionZoom(clusterId);
        map.easeTo({
            center: features[0].geometry.coordinates,
            zoom
        });
    });

    // When a click event occurs on a feature in
    // the unclustered-point layer, open a popup at
    // the location of the feature, with
    // description HTML from its properties.
    map.on('click', 'unclustered-point', function (e) {
        console.log(e.features[0]);
        const { popUpMarkup } = e.features[0].properties;
        const coordinates = e.features[0].geometry.coordinates.slice();

        // Ensure that if the map is zoomed out such that
        // multiple copies of the feature are visible, the
        // popup appears over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        new maptilersdk.Popup()
            .setLngLat(coordinates)
            .setHTML(popUpMarkup)
            .addTo(map);
    });

    //change the mouse style when the mouse enters a cluster
    map.on('mouseenter', 'clusters', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    //change the mouse style when the mouse leaves a cluster
    map.on('mouseleave', 'clusters', () => {
        map.getCanvas().style.cursor = '';
    });

});
