jQuery(function ($) {

var colors = ['rgb(228,26,28)','rgb(55,126,184)','rgb(77,175,74)','rgb(152,78,163)','rgb(255,127,0)','rgb(255,255,51)'],
    mapDiv = $('#map'),
    map = L.map('map'),
    contestSelect = $('#contest'),
    candidateSelect = $('#candidate'),
    layerRadioDiv = $('#layer-radio'),
    candidatesByContest = {},
    properties = [],
    candidateColors = {},
    currentContest,
    currentCandidate;

mapDiv.height($(window).height() - mapDiv.offset().top - $('#credits').height() - 5)
    .width($(window).width() - $('#sidebar').width);
L.tileLayer('https://{s}.tiles.mapbox.com/v3/kcivey.i8d7ca3k/{z}/{x}/{y}.png', {
    attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>'
}).addTo(map);

$.ajax({
    url: 'results.json',
    dataType: 'json'
}).then(function (results) {
    var contestNames = [],
        candidateSelect = $('#candidate');
    results.forEach(function (data, i) {
        if (data) {
            _.each(data, function (data, contestName) {
                if (!properties[i]) {
                    properties[i] = {};
                }
                properties[i][contestName] = {votes: data};
                candidatesByContest[contestName] = _.keys(data).sort();
            });
            contestNames = _.union(contestNames, _.keys(data));
        }
    });
    contestSelect.append($.map(contestNames.sort(), function (name) {
        return $('<option/>').text(name);
    })).on('change', function () {
        currentContest = $(this).val();
        var candidates = candidatesByContest[currentContest];
        candidateSelect.empty().append(
            '<option value="">- Select a candidate -</option>',
            $.map(candidates, function (name) {
                return $('<option/>').text(name);
            })
        );
        candidateColors = {};
    }).trigger('change');
    $.ajax({
        url: 'precincts.json',
        dataType: 'json'
    }).then(handlePrecinctJson);
});

function handlePrecinctJson(geoJson) {
    var layerOptions = {},
        layerStyles = {},
        controlsDiv = $('#controls'),
        voteScaleMax = 3000,
        topPrecincts = {},
        currentLayer;
    layerOptions.onEachFeature = function (feature, layer) {
        layer.bindPopup(getPopupHtml(feature));
    };
    layerOptions.style = layerStyles['Precinct winners'] =
        function (feature) {
            var data = properties[feature.id][currentContest],
                voteList = data.votes,
                winner = getWinner(data),
                total = getTotal(data),
                majority = voteList[winner] / total > 0.5;
            if (!candidateColors[winner]) {
                candidateColors[winner] = colors[_.keys(candidateColors).length];
            }
            return {
                fillColor: candidateColors[winner],
                fillOpacity: majority ? 0.8 : 0.6,
                weight: 1,
                color: 'white'
            };
        };
    currentLayer = L.geoJson(geoJson, layerOptions).addTo(map);
    map.fitBounds(currentLayer.getBounds());
    layerStyles['%'] = function (feature) {
        var data = properties[feature.id][currentContest],
            voteList = data.votes,
            total = getTotal(data);
        return {
            fillColor: getGray(voteList[currentCandidate] / total),
            fillOpacity: 1,
            weight: 1,
            color: 'white'
        };
    };
    layerStyles['votes'] = function (feature) {
        var data = properties[feature.id][currentContest],
            voteList = data.votes;
        return {
            fillColor: getGray(voteList[currentCandidate] / voteScaleMax),
            fillOpacity: 1,
            weight: 1,
            color: 'white'
        };
    };
    topPrecincts[currentCandidate] = $.map(_.sortBy(geoJson.features, function (feature) {
        return properties[feature.id][currentContest].votes[currentCandidate];
    }).reverse().slice(0, 20), function (feature) { return feature.id; });
    layerStyles['top 20 precincts'] = function (feature) {
        return {
            fillColor: 'black',
            fillOpacity: $.inArray(feature.id, topPrecincts[currentCandidate]) > -1 ? 1 : 0,
            weight: 1,
            color: 'white'
        };
    };
    layerStyles['Where the votes were'] = function (feature) {
        var data = properties[feature.id][currentContest],
            total = getTotal(data);
        return {
            fillColor: getGray(total / voteScaleMax),
            fillOpacity: 1,
            weight: 1,
            color: 'white'
        };
    };
    candidateSelect.on('change', function () {
        currentCandidate = $(this).val();
        layerRadioDiv.html(
            $.map(layerStyles, function (style, name) {
                return '<label><input type="radio" name="layer" value="' +
                    name + '"/> ' + name + '</label><br/>';
            }),
            '<label><input type="radio" name="layer" value="none"/> ' +
                'No overlay</label>'
        ).find('input:checked').trigger('click');
    });
    controlsDiv.append(
            $.map(layerStyles, function (style, name) {
                return '<label><input type="radio" name="layer" value="' +
                    name + '"/> ' + name + '</label><br/>';
            }),
            '<label><input type="radio" name="layer" value="none"/> ' +
                'No overlay</label>'
        )
        .on('click', 'input', function () {
            var name = this.value;
            if (currentLayer) {
                map.removeLayer(currentLayer);
            }
            if (name == 'none') {
                currentLayer = null;
            }
            else {
                layerOptions.style = layerStyles[name];
                currentLayer = L.geoJson(geoJson, layerOptions).addTo(map);
            }
            $('#explanation-1').toggle(name == 'Precinct winners');
            $('#explanation-2').toggle(/ %$/.test(name));
            $('#explanation-3').toggle(/ votes$/.test(name));
            $('#explanation-4').toggle(/^Where/.test(name));
            $('#explanation-5').toggle(/ precincts$/.test(name));
        })
        .find('input').eq(0).prop('checked', true);
    $('#legend-1').append(
        $.map(candidateColors, function (color, candidate) {
            return '<div class="color-block" style="background-color: ' +
                color + ';"></div> ' + candidate + '<br/>';
        })
    );
    $('#legend-2').append(
        $.map(_.range(0, 6), function (i) {
            return '<div class="color-block gray" style="background-color: ' +
                getGray(i / 5) + ';"></div> ' + i * 20 + '%<br/>';
        })
    );
    $('#legend-3').append(
        $.map(_.range(0, 6), function (i) {
            return '<div class="color-block gray" style="background-color: ' +
                getGray(i / 5) + ';"></div> ' +
                _.str.numberFormat(Math.round(i * voteScaleMax / 5)) +
                (i == 5 ? '+' : '') + ' votes<br/>';
        })
    );
    $('#legend-4').append($('#legend-3').html());
}

function getGray(fraction) {
    var hex;
    if (fraction < 0) {
        fraction = 0;
    }
    else if (fraction > 1) {
        fraction = 1;
    }
    hex = _.str.sprintf('%02x', Math.round(255 - 255 * fraction));
    return '#' + _.str.repeat(hex, 3);
}

function getWinner(data) {
    var voteList = data.votes,
        winner;
    if (!data.winner) {
        $.each(voteList, function (candidate, votes) {
            if (!winner || votes > voteList[winner]) {
                winner = candidate;
            }
        });
        data.winner = winner;
    }
    return data.winner;
}

function getTotal(data) {
    if (!data.total) {
        data.total = _.reduce(
            _.values(data.votes),
            function(memo, num){ return memo + num; },
            0
        );
    }
    return data.total;
}

function getPopupHtml(feature) {
    var precinct = feature.id,
        data = properties[precinct][currentContest],
        voteList = _.clone(data.votes),
        winner = getWinner(data),
        total = getTotal(data),
        candidates = _.keys(voteList).sort(),
        html = '<h4>Precinct ' + precinct +
            ' (Ward ' + feature.properties.ward + ')</h4>';
    html += '<table class="votes">';
    candidates.push('TOTAL');
    voteList['TOTAL'] = total;
    $.each(candidates, function (i, candidate) {
        var votes = voteList[candidate],
            percent = _.str.sprintf('%.1f', 100 * votes / total);
        if (candidate == '[Write-in]') {
            candidate = '<i>Write-in</i>';
        }
        html += (candidate == winner) ? '<tr class="winner">' : '<tr>';
        html += '<td>' + candidate  + '</td><td class="right">' +
            votes + '</td><td class="right">' + percent + '%</td></tr>';
    });
    html += '</table>';
    return html;
}

});
