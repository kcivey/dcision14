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
    allowHashUpdate = false,
    subtitleControl = L.control({position: 'topright'}),
    currentContest,
    currentCandidate;

mapDiv.height($(window).height() - mapDiv.offset().top - $('#credits').height() - 5)
    .width($(window).width() - $('#sidebar').width);
L.tileLayer('https://{s}.tiles.mapbox.com/v3/kcivey.i8d7ca3k/{z}/{x}/{y}.png', {
    attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>',
    opacity: 0.5
}).addTo(map);
subtitleControl.onAdd = function () {
    return L.DomUtil.create('div', 'subtitle');
};
subtitleControl.addTo(map);

$.getJSON('results.json').then(handleResultsJson);

function handleResultsJson(results) {
    var contestNames = [];
    results.forEach(function (precinctData, precinct) {
        if (precinctData) {
            if (!properties[precinct]) {
                properties[precinct] = {};
            }
            _.each(precinctData, function (contestData, contestName) {
                if (typeof contestData == 'number') {
                    properties[precinct][contestName.toLowerCase()] = contestData;
                    delete precinctData[contestName];
                }
                else {
                    properties[precinct][contestName] = {votes: contestData};
                    if (!candidatesByContest[contestName]) {
                        candidatesByContest[contestName] = _.keys(contestData).sort();
                    }
                }
            });
            contestNames = _.union(contestNames, _.keys(precinctData));
        }
    });
    contestSelect.append($.map(contestNames.sort(), function (name) {
        return $('<option/>').text(name);
    }));
    $.getJSON('precincts.json').then(handlePrecinctJson);
}

function handlePrecinctJson(geoJson) {
    var layerOptions = {},
        layerStyles = {},
        controlsDiv = $('#controls'),
        voteScaleMax = 3000,
        topPrecincts = {},
        currentLayer;

    contestSelect.on('change', function () {
        currentContest = $(this).val();
        var candidates = candidatesByContest[currentContest];
        candidateColors = {};
        candidateSelect.empty()
            .append(
                '<option value="">- Select a candidate -</option>',
                $.map(candidates, function (name) {
                    return $('<option/>').text(name);
                })
            )
            .val('').trigger('change');
        candidates.forEach(function (name) {
            topPrecincts[name] = $.map(_.sortBy(geoJson.features, function (feature) {
                return properties[feature.id][currentContest] ? properties[feature.id][currentContest].votes[name] : 0;
            }).reverse().slice(0, 20), function (feature) { return feature.id; });
        });
    });
    layerOptions.onEachFeature = function (feature, layer) {
        layer.bindPopup(getPopupHtml(feature));
    };
    layerOptions.style = layerStyles['Precinct winners'] =
        function (feature) {
            var data = properties[feature.id][currentContest];
            if (!data) {
                return {
                    weight: 0,
                    fillOpacity: 0
                };
            }
            var voteList = data.votes,
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
    layerStyles['Second place'] =
        function (feature) {
            var data = properties[feature.id][currentContest];
            if (!data) {
                return {
                    weight: 0,
                    fillOpacity: 0
                };
            }
            var voteList = data.votes,
                second = getSecond(data),
                total = getTotal(data),
                majority = voteList[second] / total > 0.5;
            if (!candidateColors[second]) {
                candidateColors[second] = colors[_.keys(candidateColors).length];
            }
            return {
                fillColor: candidateColors[second],
                fillOpacity: majority ? 0.8 : 0.6,
                weight: 1,
                color: 'white'
            };
        };
    layerStyles['Where the votes were (all candidates)'] = function (feature) {
        var data = properties[feature.id][currentContest];
        if (!data) {
            return {
                weight: 0,
                fillOpacity: 0
            };
        }
        var total = getTotal(data);
        return {
            fillColor: getGray(total / voteScaleMax),
            fillOpacity: 1,
            weight: 1,
            color: 'white'
        };
    };
    layerOptions.style = layerStyles['Votes per ballot (all candidates)'] =
        function (feature) {
            var data = properties[feature.id][currentContest],
                factor = /^At-Large/.test(currentContest) ? 2 : 1;
            if (!data) {
                return {
                    weight: 0,
                    fillOpacity: 0
                };
            }
            var votes= getTotal(data) / properties[feature.id].ballots;
            return {
                fillColor: getGray((votes / factor - 0.6) / 0.4),
                fillOpacity: 1,
                weight: 1,
                color: 'white'
            };
        };
    layerOptions.style = layerStyles['Turnout % (all contests)'] =
        function (feature) {
            var turnout = properties[feature.id].ballots / properties[feature.id].registered;
            return {
                fillColor: getGray(turnout),
                fillOpacity: 1,
                weight: 1,
                color: 'white'
            };
        };
    layerStyles['No overlay'] = null;
    layerStyles['%'] = function (feature) {
        var data = properties[feature.id][currentContest];
        if (!data) {
            return {
                weight: 0,
                fillOpacity: 0
            };
        }
        var voteList = data.votes,
            total = getTotal(data);
        return {
            fillColor: getGray(voteList[currentCandidate] / total),
            fillOpacity: 1,
            weight: 1,
            color: 'white'
        };
    };
    layerStyles['votes'] = function (feature) {
        var data = properties[feature.id][currentContest];
        if (!data) {
            return {
                weight: 0,
                fillOpacity: 0
            };
        }
        var voteList = data.votes;
        return {
            fillColor: getGray(voteList[currentCandidate] / voteScaleMax),
            fillOpacity: 1,
            weight: 1,
            color: 'white'
        };
    };
    layerStyles['top 20 precincts'] = function (feature) {
        return {
            fillColor: 'black',
            fillOpacity: $.inArray(feature.id, topPrecincts[currentCandidate]) > -1 ? 1 : 0,
            weight: 1,
            color: 'white'
        };
    };
    candidateSelect.on('change', function () {
        currentCandidate = $(this).val();
        var index = $('input:checked', layerRadioDiv).index('#layer-radio input'),
            radioButtons;
        if (index == -1) {
            index = 0;
        }
        layerRadioDiv.empty().append(
            $.map(layerStyles, function (style, name) {
                var display = /^[A-Z]/.test(name) ? name : (currentCandidate + ' ' + name);
                if (name == 'No overlay') {
                    name = 'none';
                }
                return /^ /.test(display) ? '' : ('<label><input type="radio" name="layer" value="' +
                    name + '"/> ' + display + '</label><br/>');
            })
        );
        radioButtons = $('input', layerRadioDiv);
        if (!index || index >= radioButtons.length) {
            index = 0;
        }
        radioButtons.eq(index).trigger('click');
    });
    controlsDiv
        .on('click', 'input', function () {
            var name = this.value,
                subtitle = $(this).closest('label').text().trim(),
                factor = /^At-Large/.test(currentContest) ? 2 : 1;
            if (!/^Turnout/.test(subtitle)) {
                subtitle = currentContest + '<br>' + subtitle;
            }
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
            $('.subtitle').html(subtitle);
            $('#legend-1, #legend-6').empty().append(
                $.map(candidateColors, function (color, candidate) {
                    return '<div class="color-block" style="background-color: ' +
                        color + ';"></div> ' + candidate + '<br/>';
                })
            );
            $('#legend-8').empty().append(
                $.map(_.range(0, 5), function (i) {
                    return '<div class="color-block gray" style="background-color: ' +
                        getGray(i / 4) + ';"></div> ' +
                        (factor * (i * 0.1 + 0.6)).toFixed(1) + ' votes<br/>';
                })
            );
            $('#explanation-1').toggle(name == 'Precinct winners');
            $('#explanation-2').toggle(/%$/.test(name));
            $('#explanation-3').toggle(/votes$/.test(name));
            $('#explanation-4').toggle(/^Where/.test(name));
            $('#explanation-5').toggle(/ precincts$/.test(name));
            $('#explanation-6').toggle(/^Second/.test(name));
            $('#explanation-7').toggle(/^Turnout/.test(name));
            $('#explanation-8').toggle(/^Votes per/.test(name));
            setTimeout(updateHashFromApp, 300); // delay so radio button has time to be checked
        });
    $('#legend-2, #legend-7').append(
        $.map(_.range(0, 6), function (i) {
            return '<div class="color-block gray" style="background-color: ' +
                getGray(i / 5) + ';"></div> ' + i * 20 + '%<br/>';
        })
    );
    $('#legend-3, #legend-4').append(
        $.map(_.range(0, 6), function (i) {
            return '<div class="color-block gray" style="background-color: ' +
                getGray(i / 5) + ';"></div> ' +
                _.str.numberFormat(Math.round(i * voteScaleMax / 5)) +
                (i == 5 ? '+' : '') + ' votes<br/>';
        })
    );
    updateAppFromHash();
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
        candidates = _.keys(voteList).sort(function (a, b) {
            return voteList[b] - voteList[a];
        });
    data.winner = candidates[0];
    data.second = candidates[1];
    return data.winner;
}

function getSecond(data) {
    getWinner(data);
    return data.second;
}

function getTotal(data) {
    if (!data) {
        return 0;
    }
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
        data = properties[precinct][currentContest];
    if (!data) {
        return '';
    }
    var voteList = _.clone(data.votes),
        winner = getWinner(data),
        total = getTotal(data),
        candidates = _.keys(voteList).sort(),
        turnout = _.str.sprintf('%.1f', 100 * properties[precinct].ballots / properties[precinct].registered),
        votesPerBallot = _.str.sprintf('%.2f', total / properties[precinct].ballots),
        html = '<h4>Precinct ' + precinct +
            ' (Ward ' + feature.properties.ward + ')<br>' + feature.properties.name + '</h4>';
    html += '<table class="votes">';
    candidates.push('TOTAL');
    voteList['TOTAL'] = total;
    $.each(candidates, function (i, candidate) {
        var votes = voteList[candidate],
            percent = _.str.sprintf('%.1f', 100 * votes / total);
        candidate = candidate.replace(/\[(.+)\]/, '<i>$1</i>');
        html += (candidate == winner ? '<tr class="winner">' : '<tr>') +
            '<td>' + candidate  + '</td><td class="right">' +
            _.str.numberFormat(votes) + '</td><td class="right">' + percent + '%</td></tr>';
    });
    html += '</table><hr><table class="votes">' +
        '<tr><td colspan="2">Registered voters</td><td class="right">' + _.str.numberFormat(properties[precinct].registered)  + '</td></tr>' +
        '<tr><td colspan="2">Ballots</td><td class="right">' + _.str.numberFormat(properties[precinct].ballots)  + '</td></tr>' +
        '<tr><td colspan="2">Turnout</td><td class="right">' + turnout  + '%</td></tr>' +
        '<tr><td colspan="2">Votes per ballot</td><td class="right">' + votesPerBallot  + '</td></tr>' +
        '</table>';
    return html;
}

function updateHashFromApp() {
    var hash = contestSelect[0].selectedIndex + '-' + candidateSelect[0].selectedIndex + '-' +
        $('input:checked', layerRadioDiv).index('#layer-radio input');
    if (allowHashUpdate && (hash != '0-0-0' || window.location.hash.length > 1)) {
        window.location.hash = hash;
    }
}

function updateAppFromHash() {
    var state = (window.location.hash.substr(1) || '0-0-0').split('-');
    if (state.length == 3) {
        allowHashUpdate = false;
        $('option', contestSelect).eq(state[0]).prop('selected', true).trigger('change');
        $('option', candidateSelect).eq(state[1]).prop('selected', true).trigger('change');
        $('input', layerRadioDiv).eq(state[2]).trigger('click');
        allowHashUpdate = true;
    }
}

});
