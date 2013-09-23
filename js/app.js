require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Chord, ChordDiagram, Chords, Instruments, Layout, Scale, Scales, app, chordFingerings, _ref;

ChordDiagram = require('./chord_diagram');

Layout = require('./layout');

Instruments = require('./instruments');

chordFingerings = require('./fingerings').chordFingerings;

_ref = require('./theory'), Chord = _ref.Chord, Chords = _ref.Chords, Scale = _ref.Scale, Scales = _ref.Scales;

angular.element(document).ready(function() {
  return angular.bootstrap(document, ['FretboardApp']);
});

app = angular.module('FretboardApp', ['ngAnimate', 'ngRoute', 'ngSanitize']);

app.config(function($locationProvider, $routeProvider) {
  return $routeProvider.when('/', {
    controller: 'ChordTableCtrl',
    templateUrl: 'templates/chord-table.html'
  }).when('/chord/:chordName', {
    controller: 'ChordDetailsCtrl',
    templateUrl: 'templates/chord-details.html'
  }).otherwise({
    redirectTo: '/'
  });
});

app.controller('ChordTableCtrl', function($scope) {
  $scope.tonics = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  return $scope.getScaleChords = (function() {
    var cache;
    cache = {};
    return function(scaleName, sevenths) {
      var _name;
      return cache[_name = [scaleName, sevenths]] || (cache[_name] = Scale.find(scaleName).chords({
        sevenths: sevenths
      }));
    };
  })();
});

_.mixin({
  reverse: function(array) {
    return [].concat(array).reverse();
  }
});

app.controller('ChordDetailsCtrl', function($scope, $routeParams) {
  var badge, chord, chordName, fingering, instrument, labels, name, _i, _len, _ref1, _ref2, _results;
  chordName = $routeParams.chordName;
  chordName = chordName.replace('&#9839;', '#');
  chord = Chord.find(chordName);
  instrument = Instruments.Default;
  $scope.instrument = instrument;
  $scope.chord = chord;
  $scope.fingerings = chordFingerings(chord, instrument);
  $scope.orderBy = function(key) {
    var fingering, fingerings, labels, privative, values, _i, _len;
    $scope.sortKey = key;
    fingerings = $scope.fingerings;
    values = _.compact(fingerings.map(function(f) {
      return f.properties[key];
    }));
    privative = values[0] === true || values[0] === false;
    if (privative) {
      fingerings = _.reverse(fingerings);
    }
    fingerings = _.sortBy(fingerings, function(f) {
      return f.properties[key] || 0;
    });
    if (privative) {
      fingerings = _.reverse(fingerings);
    }
    for (_i = 0, _len = fingerings.length; _i < _len; _i++) {
      fingering = fingerings[_i];
      labels = fingering.labels.filter(function(label) {
        return label.name === key;
      });
      if (labels.length) {
        fingering.labels = labels.concat(_.difference(fingering.labels, labels));
      }
    }
    return $scope.fingerings = fingerings;
  };
  _ref1 = $scope.fingerings;
  _results = [];
  for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
    fingering = _ref1[_i];
    labels = [];
    _ref2 = fingering.properties;
    for (name in _ref2) {
      badge = _ref2[name];
      if (badge === true) {
        badge = null;
      }
      labels.push({
        name: name,
        badge: badge
      });
    }
    _results.push(fingering.labels = labels.sort());
  }
  return _results;
});

app.directive('chord', function() {
  return {
    restrict: 'CE',
    replace: true,
    template: function() {
      var dimensions, instrument;
      instrument = Instruments.Default;
      dimensions = {
        width: ChordDiagram.width(instrument),
        height: ChordDiagram.height(instrument)
      };
      return "<div><span class='fretNumber' ng:show='topFret'>{{topFret}}</span>" + ("<canvas width='" + dimensions.width + "' height='" + dimensions.height + "'/></div>");
    },
    scope: {
      chord: '=',
      fingering: '=?'
    },
    link: function(scope, element, attrs) {
      var canvas, ctx, instrument, render;
      canvas = element[0].querySelector('canvas');
      ctx = canvas.getContext('2d');
      instrument = Instruments.Default;
      render = function() {
        var chord, fingering, fingerings, topFret;
        chord = scope.chord, fingering = scope.fingering;
        fingerings = chordFingerings(chord, instrument);
        fingering || (fingering = fingerings[0]);
        if (!fingering) {
          return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        topFret = ChordDiagram.draw(ctx, instrument, fingering.positions, {
          barres: fingering.barres
        }).topFret;
        if (topFret > 0) {
          return scope.topFret = topFret;
        }
      };
      return render();
    }
  };
});

app.filter('raiseAccidentals', function() {
  return function(name) {
    return name.replace(/([♯♭])/, '<sup>$1</sup>');
  };
});


},{"./chord_diagram":"EHWjuh","./fingerings":"/X1WgR","./instruments":"B8u3u9","./layout":"B83s2m","./theory":"80u6C5"}],"QgR0mD":[function(require,module,exports){



},{}],"EHWjuh":[function(require,module,exports){
var DefaultStyle, FretCount, FretNumbers, Layout, SmallStyle, computeChordDiagramDimensions, drawChordBlock, drawChordDiagram, drawChordDiagramFrets, drawChordDiagramStrings, hsv2css, _, _ref,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

_ = require('underscore');

_ref = require('./instruments'), FretCount = _ref.FretCount, FretNumbers = _ref.FretNumbers;

Layout = require('./layout');

hsv2css = require('./utils').hsv2css;

SmallStyle = {
  h_gutter: 5,
  v_gutter: 5,
  string_spacing: 6,
  fret_height: 8,
  above_fretboard: 8,
  note_radius: 1,
  closed_string_fontsize: 4,
  chord_degree_colors: ['red', 'blue', 'green', 'orange'],
  intervalClass_colors: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function(n) {
    return hsv2css({
      h: n * 360 / 12,
      s: 1,
      v: 1
    });
  })
};

DefaultStyle = _.extend({}, SmallStyle, {
  string_spacing: 12,
  fret_height: 16,
  note_radius: 3,
  closed_string_fontsize: 8
});

computeChordDiagramDimensions = function(instrument, style) {
  if (style == null) {
    style = DefaultStyle;
  }
  return {
    width: 2 * style.h_gutter + (instrument.strings - 1) * style.string_spacing,
    height: 2 * style.v_gutter + (style.fret_height + 2) * FretCount
  };
};

drawChordDiagramStrings = function(ctx, instrument, options) {
  var string, style, x, _i, _len, _ref1, _results;
  if (options == null) {
    options = {};
  }
  style = DefaultStyle;
  _ref1 = instrument.stringNumbers;
  _results = [];
  for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
    string = _ref1[_i];
    x = string * style.string_spacing + style.h_gutter;
    ctx.beginPath();
    ctx.moveTo(x, style.v_gutter + style.above_fretboard);
    ctx.lineTo(x, style.v_gutter + style.above_fretboard + FretCount * style.fret_height);
    ctx.strokeStyle = (options.dimStrings && __indexOf.call(options.dimStrings, string) >= 0 ? 'rgba(0,0,0,0.2)' : 'black');
    _results.push(ctx.stroke());
  }
  return _results;
};

drawChordDiagramFrets = function(ctx, instrument, _arg) {
  var drawNut, fret, style, y, _i, _len, _results;
  drawNut = (_arg != null ? _arg : {
    drawNut: true
  }).drawNut;
  style = DefaultStyle;
  ctx.strokeStyle = 'black';
  _results = [];
  for (_i = 0, _len = FretNumbers.length; _i < _len; _i++) {
    fret = FretNumbers[_i];
    y = style.v_gutter + style.above_fretboard + fret * style.fret_height;
    ctx.beginPath();
    ctx.moveTo(style.v_gutter - 0.5, y);
    ctx.lineTo(style.v_gutter + 0.5 + (instrument.strings - 1) * style.string_spacing, y);
    if (fret === 0 && drawNut) {
      ctx.lineWidth = 3;
    }
    ctx.stroke();
    _results.push(ctx.lineWidth = 1);
  }
  return _results;
};

drawChordDiagram = function(ctx, instrument, positions, options) {
  var barres, defaults, drawBarres, drawClosedStrings, drawFingerPosition, drawFingerPositions, drawNut, dy, fingerCoordinates, fret, frets, highestFret, lowestFret, string, style, topFret, usedStrings;
  if (options == null) {
    options = {};
  }
  defaults = {
    drawClosedStrings: true,
    drawNut: true,
    dy: 0,
    style: DefaultStyle
  };
  options = _.extend(defaults, options);
  barres = options.barres, dy = options.dy, drawClosedStrings = options.drawClosedStrings, drawNut = options.drawNut, style = options.style;
  topFret = 0;
  frets = (function() {
    var _i, _len, _results;
    _results = [];
    for (_i = 0, _len = positions.length; _i < _len; _i++) {
      fret = positions[_i].fret;
      if (fret !== 0) {
        _results.push(fret);
      }
    }
    return _results;
  })();
  lowestFret = Math.min.apply(Math, frets);
  highestFret = Math.max.apply(Math, frets);
  if (highestFret > 4) {
    topFret = lowestFret - 1;
    drawNut = false;
  }
  if (options.dimUnusedStrings) {
    usedStrings = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = positions.length; _i < _len; _i++) {
        string = positions[_i].string;
        _results.push(string);
      }
      return _results;
    })();
    options.dimStrings = (function() {
      var _i, _len, _ref1, _results;
      _ref1 = instrument.stringNumbers;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        string = _ref1[_i];
        if (__indexOf.call(usedStrings, string) < 0) {
          _results.push(string);
        }
      }
      return _results;
    })();
  }
  fingerCoordinates = function(_arg) {
    var fret, string;
    string = _arg.string, fret = _arg.fret;
    if (fret > 0) {
      fret -= topFret;
    }
    return {
      x: style.h_gutter + string * style.string_spacing,
      y: style.v_gutter + style.above_fretboard + (fret - 0.5) * style.fret_height + dy
    };
  };
  drawFingerPosition = function(position, options) {
    var color, isRoot, x, y, _ref1;
    if (options == null) {
      options = {};
    }
    isRoot = options.isRoot, color = options.color;
    _ref1 = fingerCoordinates(position), x = _ref1.x, y = _ref1.y;
    ctx.fillStyle = color || (isRoot ? 'red' : 'white');
    ctx.strokeStyle = color || (isRoot ? 'red' : 'black');
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (isRoot && position.fret) {
      (function(r) {
        return ctx.rect(x - r, y - r, 2 * r, 2 * r);
      })(style.note_radius);
    } else {
      ctx.arc(x, y, style.note_radius, 0, Math.PI * 2, false);
    }
    if (position.fret > 0 || isRoot) {
      ctx.fill();
    }
    return ctx.stroke();
  };
  drawBarres = function() {
    var eccentricity, firstString, stringCount, w, x1, x2, y, _fn, _fn1, _i, _len, _ref1, _ref2, _results;
    ctx.fillStyle = 'black';
    _fn = function() {
      ctx.save();
      ctx.scale(w, eccentricity);
      ctx.arc(0, 0, style.string_spacing / 2 / eccentricity, Math.PI, 0, false);
      return ctx.restore();
    };
    _fn1 = function() {
      ctx.save();
      ctx.scale(w, 14);
      ctx.arc(0, 0, style.string_spacing / 2 / eccentricity, 0, Math.PI, true);
      return ctx.restore();
    };
    _results = [];
    for (_i = 0, _len = barres.length; _i < _len; _i++) {
      _ref1 = barres[_i], fret = _ref1.fret, firstString = _ref1.firstString, stringCount = _ref1.stringCount;
      _ref2 = fingerCoordinates({
        string: firstString,
        fret: fret
      }), x1 = _ref2.x, y = _ref2.y;
      x2 = fingerCoordinates({
        string: firstString + stringCount - 1,
        fret: fret
      }).x;
      w = x2 - x1;
      ctx.save();
      ctx.translate((x1 + x2) / 2, y - style.fret_height * .25);
      ctx.beginPath();
      eccentricity = 10;
      _fn();
      _fn1();
      ctx.fill();
      _results.push(ctx.restore());
    }
    return _results;
  };
  drawFingerPositions = function() {
    var default_options, position, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = positions.length; _i < _len; _i++) {
      position = positions[_i];
      default_options = {
        color: style.intervalClass_colors[position.intervalClass],
        isRoot: position.intervalClass === 0
      };
      _results.push(drawFingerPosition(position, _.extend(default_options, position)));
    }
    return _results;
  };
  drawClosedStrings = function() {
    var closed_strings, fretted_strings, position, r, x, y, _i, _j, _len, _len1, _ref1, _results;
    fretted_strings = [];
    for (_i = 0, _len = positions.length; _i < _len; _i++) {
      position = positions[_i];
      fretted_strings[position.string] = true;
    }
    closed_strings = (function() {
      var _j, _len1, _ref1, _results;
      _ref1 = instrument.stringNumbers;
      _results = [];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        string = _ref1[_j];
        if (!fretted_strings[string]) {
          _results.push(string);
        }
      }
      return _results;
    })();
    r = style.note_radius;
    ctx.fillStyle = 'black';
    _results = [];
    for (_j = 0, _len1 = closed_strings.length; _j < _len1; _j++) {
      string = closed_strings[_j];
      _ref1 = fingerCoordinates({
        string: string,
        fret: 0
      }), x = _ref1.x, y = _ref1.y;
      ctx.strokeStyle = 'black';
      ctx.beginPath();
      ctx.moveTo(x - r, y - r);
      ctx.lineTo(x + r, y + r);
      ctx.moveTo(x - r, y + r);
      ctx.lineTo(x + r, y - r);
      _results.push(ctx.stroke());
    }
    return _results;
  };
  drawChordDiagramStrings(ctx, instrument, options);
  drawChordDiagramFrets(ctx, instrument, {
    drawNut: drawNut
  });
  if (barres) {
    drawBarres();
  }
  if (positions) {
    drawFingerPositions();
  }
  if (positions && options.drawClosedStrings) {
    drawClosedStrings();
  }
  return {
    topFret: topFret
  };
};

drawChordBlock = function(instrument, positions, options) {
  var dimensions;
  dimensions = computeChordDiagramDimensions(instrument);
  return Layout.block({
    width: dimensions.width,
    height: dimensions.height,
    draw: function() {
      return Layout.withGraphicsContext(function(ctx) {
        ctx.translate(0, -dimensions.height);
        return drawChordDiagram(ctx, instrument, positions, options);
      });
    }
  });
};

module.exports = {
  defaultStyle: DefaultStyle,
  width: function(instrument) {
    return computeChordDiagramDimensions(instrument).width;
  },
  height: function(instrument) {
    return computeChordDiagramDimensions(instrument).height;
  },
  draw: drawChordDiagram,
  block: drawChordBlock
};


},{"./instruments":"B8u3u9","./layout":"B83s2m","./utils":"+Nu4mz","underscore":24}],"/X1WgR":[function(require,module,exports){
var Fingering, FretNumbers, Instruments, bestFingeringFor, chordFingerings, collectBarreSets, computeBarreCandidateStrings, findBarres, fingerPositionsOnChord, fretboardPositionsEach, getPitchClassName, intervalClassDifference, pitchNumberForPosition, powerset, util, _, _ref,
  __slice = [].slice,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

util = require('util');

_ = require('underscore');

_ref = require('./theory'), getPitchClassName = _ref.getPitchClassName, intervalClassDifference = _ref.intervalClassDifference;

Instruments = require('./instruments');

FretNumbers = Instruments.FretNumbers, fretboardPositionsEach = Instruments.fretboardPositionsEach, pitchNumberForPosition = Instruments.pitchNumberForPosition;

require('./utils');

Fingering = (function() {
  function Fingering(_arg) {
    this.positions = _arg.positions, this.chord = _arg.chord, this.barres = _arg.barres, this.instrument = _arg.instrument;
    this.positions.sort(function(a, b) {
      return a.string - b.string;
    });
    this.properties = {};
  }

  Fingering.cached_getter('fretstring', function() {
    var fret, fretArray, s, string, x, _i, _len, _ref1, _ref2;
    fretArray = (function() {
      var _i, _len, _ref1, _results;
      _ref1 = this.instrument.stringNumbers;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        s = _ref1[_i];
        _results.push(-1);
      }
      return _results;
    }).call(this);
    _ref1 = this.positions;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      _ref2 = _ref1[_i], string = _ref2.string, fret = _ref2.fret;
      fretArray[string] = fret;
    }
    return ((function() {
      var _j, _len1, _results;
      _results = [];
      for (_j = 0, _len1 = fretArray.length; _j < _len1; _j++) {
        x = fretArray[_j];
        _results.push(x >= 0 ? x : 'x');
      }
      return _results;
    })()).join('');
  });

  Fingering.cached_getter('chordName', function() {
    var name;
    name = this.chord.name;
    if (this.inversion > 0) {
      name += " / " + (getPitchClassName(this.instrument.pitchAt(this.positions[0])));
    }
    return name;
  });

  Fingering.cached_getter('inversion', function() {
    return this.chord.pitchClasses.indexOf(intervalClassDifference(this.chord.rootPitch, this.instrument.pitchAt(this.positions[0])));
  });

  Fingering.cached_getter('inversionLetter', function() {
    if (!(this.inversion > 0)) {
      return;
    }
    return String.fromCharCode(96 + this.inversion);
  });

  return Fingering;

})();

powerset = function(array) {
  var tail, x, xs, ys;
  if (!array.length) {
    return [[]];
  }
  x = array[0], xs = 2 <= array.length ? __slice.call(array, 1) : [];
  tail = powerset(xs);
  return tail.concat((function() {
    var _i, _len, _results;
    _results = [];
    for (_i = 0, _len = tail.length; _i < _len; _i++) {
      ys = tail[_i];
      _results.push([x].concat(ys));
    }
    return _results;
  })());
};

computeBarreCandidateStrings = function(instrument, fretArray) {
  var codeStrings, fret, referenceFret, _i, _len;
  codeStrings = [];
  for (_i = 0, _len = fretArray.length; _i < _len; _i++) {
    referenceFret = fretArray[_i];
    if (typeof referenceFret !== 'number') {
      continue;
    }
    codeStrings[referenceFret] || (codeStrings[referenceFret] = ((function() {
      var _j, _len1, _results;
      _results = [];
      for (_j = 0, _len1 = fretArray.length; _j < _len1; _j++) {
        fret = fretArray[_j];
        if (fret < referenceFret) {
          _results.push('<');
        } else if (fret > referenceFret) {
          _results.push('>');
        } else if (fret === referenceFret) {
          _results.push('=');
        } else {
          _results.push('x');
        }
      }
      return _results;
    })()).join(''));
  }
  return codeStrings;
};

findBarres = function(instrument, fretArray) {
  var barres, codeString, fret, match, run, _i, _len, _ref1;
  barres = [];
  _ref1 = computeBarreCandidateStrings(instrument, fretArray);
  for (fret = _i = 0, _len = _ref1.length; _i < _len; fret = ++_i) {
    codeString = _ref1[fret];
    if (fret === 0) {
      continue;
    }
    if (!codeString) {
      continue;
    }
    match = codeString.match(/(=[>=]+)/);
    if (!match) {
      continue;
    }
    run = match[1];
    if (!(run.match(/\=/g).length > 1)) {
      continue;
    }
    barres.push({
      fret: fret,
      firstString: match.index,
      stringCount: run.length,
      fingerReplacementCount: run.match(/\=/g).length
    });
  }
  return barres;
};

collectBarreSets = function(instrument, fretArray) {
  var barres;
  barres = findBarres(instrument, fretArray);
  return powerset(barres);
};

fingerPositionsOnChord = function(chord, instrument) {
  var pitchClasses, positions, rootPitch;
  rootPitch = chord.rootPitch, pitchClasses = chord.pitchClasses;
  positions = [];
  instrument.eachFingerPosition(function(pos) {
    var degreeIndex, intervalClass;
    intervalClass = intervalClassDifference(rootPitch, instrument.pitchAt(pos));
    degreeIndex = pitchClasses.indexOf(intervalClass);
    if (degreeIndex >= 0) {
      return positions.push(pos);
    }
  });
  return positions;
};

chordFingerings = function(chord, instrument, options) {
  var chordNoteCount, collectFingeringPositions, containsAllChordPitches, countDistinctNotes, filterFingerings, filters, fingering, fingerings, fn, fourFingersOrFewer, fretsPerString, generateFingerings, getFingerCount, hasAllNotes, highNoteCount, isRootPosition, maximumFretDistance, mutedMedialStrings, mutedTrebleStrings, name, preferences, properties, reverseSortKey, sortFingerings, value, warn, _i, _len;
  if (options == null) {
    options = {};
  }
  options = _.extend({
    filter: true
  }, options);
  warn = false;
  if (chord.rootPitch == null) {
    throw new Error("No root for " + (util.inspect(chord)));
  }
  fretsPerString = function() {
    var fret, positions, s, string, strings, _i, _len, _ref1;
    positions = fingerPositionsOnChord(chord, instrument);
    strings = (function() {
      var _i, _ref1, _results;
      _results = [];
      for (s = _i = 0, _ref1 = instrument.stringCount; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; s = 0 <= _ref1 ? ++_i : --_i) {
        _results.push([null]);
      }
      return _results;
    })();
    for (_i = 0, _len = positions.length; _i < _len; _i++) {
      _ref1 = positions[_i], string = _ref1.string, fret = _ref1.fret;
      if (fret <= 4) {
        strings[string].push(fret);
      }
    }
    return strings;
  };
  collectFingeringPositions = function(fretCandidatesPerString) {
    var fill, fretArray, positionSet, stringCount;
    stringCount = fretCandidatesPerString.length;
    positionSet = [];
    fretArray = [];
    fill = function(s) {
      var fret, _i, _len, _ref1, _results;
      if (s === stringCount) {
        return positionSet.push(fretArray.slice());
      } else {
        _ref1 = fretCandidatesPerString[s];
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          fret = _ref1[_i];
          fretArray[s] = fret;
          _results.push(fill(s + 1));
        }
        return _results;
      }
    };
    fill(0);
    return positionSet;
  };
  containsAllChordPitches = function(fretArray) {
    var fret, pitchClass, pitches, string, _i, _len;
    pitches = [];
    for (string = _i = 0, _len = fretArray.length; _i < _len; string = ++_i) {
      fret = fretArray[string];
      if (typeof fret !== 'number') {
        continue;
      }
      pitchClass = (instrument.pitchAt({
        fret: fret,
        string: string
      })) % 12;
      if (!(pitches.indexOf(pitchClass) >= 0)) {
        pitches.push(pitchClass);
      }
    }
    return pitches.length === chord.pitchClasses.length;
  };
  maximumFretDistance = function(fretArray) {
    var fret, frets;
    frets = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = fretArray.length; _i < _len; _i++) {
        fret = fretArray[_i];
        if (typeof fret === 'number') {
          _results.push(fret);
        }
      }
      return _results;
    })();
    return Math.max.apply(Math, frets) - Math.min.apply(Math, frets) <= 3;
  };
  generateFingerings = function() {
    var barres, fingerings, fret, fretArray, fretArrays, pos, positions, sets, string, _i, _j, _k, _len, _len1, _len2;
    fingerings = [];
    fretArrays = collectFingeringPositions(fretsPerString());
    fretArrays = fretArrays.filter(containsAllChordPitches);
    fretArrays = fretArrays.filter(maximumFretDistance);
    for (_i = 0, _len = fretArrays.length; _i < _len; _i++) {
      fretArray = fretArrays[_i];
      positions = (function() {
        var _j, _len1, _results;
        _results = [];
        for (string = _j = 0, _len1 = fretArray.length; _j < _len1; string = ++_j) {
          fret = fretArray[string];
          if (typeof fret === 'number') {
            _results.push({
              fret: fret,
              string: string
            });
          }
        }
        return _results;
      })();
      for (_j = 0, _len1 = positions.length; _j < _len1; _j++) {
        pos = positions[_j];
        pos.intervalClass = intervalClassDifference(chord.rootPitch, instrument.pitchAt(pos));
        pos.degreeIndex = chord.pitchClasses.indexOf(pos.intervalClass);
      }
      sets = [[]];
      if (positions.length > 4) {
        sets = collectBarreSets(instrument, fretArray);
      }
      for (_k = 0, _len2 = sets.length; _k < _len2; _k++) {
        barres = sets[_k];
        fingerings.push(new Fingering({
          positions: positions,
          chord: chord,
          barres: barres,
          instrument: instrument
        }));
      }
    }
    return fingerings;
  };
  chordNoteCount = chord.pitchClasses.length;
  countDistinctNotes = function(fingering) {
    var intervalClass, pitches, _i, _len, _ref1;
    pitches = [];
    _ref1 = fingering.positions;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      intervalClass = _ref1[_i].intervalClass;
      if (__indexOf.call(pitches, intervalClass) < 0) {
        pitches.push(intervalClass);
      }
    }
    return pitches.length;
  };
  hasAllNotes = function(fingering) {
    return countDistinctNotes(fingering) === chordNoteCount;
  };
  mutedMedialStrings = function(fingering) {
    return fingering.fretstring.match(/\dx+\d/);
  };
  mutedTrebleStrings = function(fingering) {
    return fingering.fretstring.match(/x$/);
  };
  getFingerCount = function(fingering) {
    var barre, n, pos, _i, _len, _ref1;
    n = ((function() {
      var _i, _len, _ref1, _results;
      _ref1 = fingering.positions;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        pos = _ref1[_i];
        if (pos.fret > 0) {
          _results.push(pos);
        }
      }
      return _results;
    })()).length;
    _ref1 = fingering.barres;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      barre = _ref1[_i];
      n -= barre.fingerReplacementCount - 1;
    }
    return n;
  };
  fourFingersOrFewer = function(fingering) {
    return getFingerCount(fingering) <= 4;
  };
  filters = [];
  if (options.filter) {
    filters.push({
      name: 'four fingers or fewer',
      select: fourFingersOrFewer
    });
  }
  if (!options.fingerpicking) {
    filters.push({
      name: 'no muted medial strings',
      reject: mutedMedialStrings
    });
    filters.push({
      name: 'no muted treble strings',
      reject: mutedTrebleStrings
    });
  }
  filterFingerings = function(fingerings) {
    var filtered, name, reject, select, _i, _len, _ref1;
    for (_i = 0, _len = filters.length; _i < _len; _i++) {
      _ref1 = filters[_i], name = _ref1.name, select = _ref1.select, reject = _ref1.reject;
      filtered = fingerings;
      if (reject) {
        select = (function(x) {
          return !reject(x);
        });
      }
      if (select) {
        filtered = filtered.filter(select);
      }
      if (!filtered.length) {
        if (warn) {
          console.warn("" + chord_name + ": no fingerings pass filter \"" + name + "\"");
        }
        filtered = fingerings;
      }
      fingerings = filtered;
    }
    return fingerings;
  };
  highNoteCount = function(fingering) {
    return fingering.positions.length;
  };
  isRootPosition = function(fingering) {
    return _(fingering.positions).sortBy(function(pos) {
      return pos.string;
    })[0].degreeIndex === 0;
  };
  reverseSortKey = function(fn) {
    return function(a) {
      return -fn(a);
    };
  };
  preferences = [
    {
      name: 'root position',
      key: isRootPosition
    }, {
      name: 'high note count',
      key: highNoteCount
    }, {
      name: 'avoid barres',
      key: reverseSortKey(function(fingering) {
        return fingering.barres.length;
      })
    }, {
      name: 'low finger count',
      key: reverseSortKey(getFingerCount)
    }
  ];
  sortFingerings = function(fingerings) {
    var key, _i, _len, _ref1;
    _ref1 = preferences.slice(0).reverse();
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      key = _ref1[_i].key;
      fingerings = _(fingerings).sortBy(key);
    }
    fingerings.reverse();
    return fingerings;
  };
  fingerings = generateFingerings();
  fingerings = filterFingerings(fingerings);
  fingerings = sortFingerings(fingerings);
  properties = {
    root: isRootPosition,
    barres: function(f) {
      return f.barres.length;
    },
    fingers: getFingerCount,
    inversion: function(f) {
      return f.inversionLetter;
    },
    skipping: /\dx\d/,
    muting: /\dx/,
    open: /0/,
    triad: function(_arg) {
      var positions;
      positions = _arg.positions;
      return positions.length === 3;
    },
    position: function(_arg) {
      var positions;
      positions = _arg.positions;
      return _.min(_.pluck(positions, 'fret'));
    },
    strings: function(_arg) {
      var positions;
      positions = _arg.positions;
      return positions.length;
    }
  };
  for (name in properties) {
    fn = properties[name];
    for (_i = 0, _len = fingerings.length; _i < _len; _i++) {
      fingering = fingerings[_i];
      value = fn instanceof RegExp ? fn.test(fingering.fretstring) : fn(fingering);
      if (value) {
        fingering.properties[name] = value;
      }
    }
  }
  return fingerings;
};

bestFingeringFor = function(chord, instrument) {
  return chordFingerings(chord, instrument)[0];
};

module.exports = {
  bestFingeringFor: bestFingeringFor,
  chordFingerings: chordFingerings
};


},{"./instruments":"B8u3u9","./theory":"80u6C5","./utils":"+Nu4mz","underscore":24,"util":19}],"V9DGE2":[function(require,module,exports){
var DefaultStyle, FretCount, FretNumbers, drawFretboard, drawFretboardFingerPosition, drawFretboardFrets, drawFretboardStrings, paddedFretboardHeight, paddedFretboardWidth, _ref;

_ref = require('./instruments'), FretCount = _ref.FretCount, FretNumbers = _ref.FretNumbers;

DefaultStyle = {
  h_gutter: 10,
  v_gutter: 10,
  string_spacing: 20,
  fret_width: 45,
  fret_overhang: .3 * 45
};

paddedFretboardWidth = function(instrument, style) {
  if (style == null) {
    style = DefaultStyle;
  }
  return 2 * style.v_gutter + style.fret_width * FretCount + style.fret_overhang;
};

paddedFretboardHeight = function(instrument, style) {
  if (style == null) {
    style = DefaultStyle;
  }
  return 2 * style.h_gutter + (instrument.strings - 1) * style.string_spacing;
};

drawFretboardStrings = function(instrument, ctx) {
  var string, style, y, _i, _len, _ref1, _results;
  style = DefaultStyle;
  _ref1 = instrument.stringNumbers;
  _results = [];
  for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
    string = _ref1[_i];
    y = string * style.string_spacing + style.h_gutter;
    ctx.beginPath();
    ctx.moveTo(style.h_gutter, y);
    ctx.lineTo(style.h_gutter + FretCount * style.fret_width + style.fret_overhang, y);
    ctx.lineWidth = 1;
    _results.push(ctx.stroke());
  }
  return _results;
};

drawFretboardFrets = function(ctx, instrument) {
  var fret, style, x, _i, _len, _results;
  style = DefaultStyle;
  _results = [];
  for (_i = 0, _len = FretNumbers.length; _i < _len; _i++) {
    fret = FretNumbers[_i];
    x = style.h_gutter + fret * style.fret_width;
    ctx.beginPath();
    ctx.moveTo(x, style.h_gutter);
    ctx.lineTo(x, style.h_gutter + (instrument.strings - 1) * style.string_spacing);
    if (fret === 0) {
      ctx.lineWidth = 3;
    }
    ctx.stroke();
    _results.push(ctx.lineWidth = 1);
  }
  return _results;
};

drawFretboardFingerPosition = function(ctx, instrument, position, options) {
  var color, fret, isRoot, string, style, x, y;
  if (options == null) {
    options = {};
  }
  string = position.string, fret = position.fret;
  isRoot = options.isRoot, color = options.color;
  style = DefaultStyle;
  color || (color = isRoot ? 'red' : 'white');
  x = style.h_gutter + (fret - 0.5) * style.fret_width;
  if (fret === 0) {
    x = style.h_gutter;
  }
  y = style.v_gutter + (5 - string) * style.string_spacing;
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, 2 * Math.PI, false);
  ctx.fillStyle = color;
  if (!isRoot) {
    ctx.lineWidth = 2;
  }
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'black';
  return ctx.lineWidth = 1;
};

drawFretboard = function(ctx, instrument, positions) {
  var position, _i, _len, _ref1, _results;
  drawFretboardStrings(ctx, instrument);
  drawFretboardFrets(ctx, instrument);
  _ref1 = positions || [];
  _results = [];
  for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
    position = _ref1[_i];
    _results.push(drawFretboardFingerPosition(ctx, instrument, position, position));
  }
  return _results;
};

module.exports = {
  draw: drawFretboard,
  height: paddedFretboardHeight,
  width: paddedFretboardWidth
};


},{"./instruments":"B8u3u9"}],"NBDcvj":[function(require,module,exports){
var ChordDiagram, DefaultStyle, IntervalNames, IntervalVectors, block, drawHarmonicTable, drawText, harmonicTableBlock, intervalClassVectors, withAlignment, withGraphicsContext, _, _ref,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

_ = require('underscore');

IntervalNames = require('./theory').IntervalNames;

_ref = require('./layout'), block = _ref.block, drawText = _ref.drawText, withGraphicsContext = _ref.withGraphicsContext, withAlignment = _ref.withAlignment;

ChordDiagram = require('./chord_diagram');

DefaultStyle = {
  intervalClass_colors: ChordDiagram.defaultStyle.intervalClass_colors,
  radius: 50,
  center: true,
  fill_cells: false,
  label_cells: false
};

IntervalVectors = {
  2: {
    P5: -1,
    m3: -1
  },
  3: {
    m3: 1
  },
  4: {
    M3: 1
  },
  5: {
    P5: -1
  },
  6: {
    m3: 2
  },
  11: {
    P5: 1,
    M3: 1
  }
};

intervalClassVectors = function(intervalClass) {
  var adjust, adjustments, computed_semitones, intervals, k, original_intervalClass, record, sign, v, _ref1, _ref2;
  original_intervalClass = intervalClass;
  adjustments = {};
  adjust = function(d_ic, intervals) {
    var k, v, _results;
    intervalClass += d_ic;
    for (k in intervals) {
      if (adjustments[k] == null) {
        adjustments[k] = 0;
      }
    }
    _results = [];
    for (k in intervals) {
      v = intervals[k];
      _results.push(adjustments[k] += v);
    }
    return _results;
  };
  while (intervalClass >= 24) {
    adjust(-24, {
      P5: 4,
      M3: -1
    });
  }
  while (intervalClass >= 12) {
    adjust(-12, {
      M3: 3
    });
  }
  _ref1 = [IntervalVectors[intervalClass], 1], record = _ref1[0], sign = _ref1[1];
  if (!record) {
    _ref2 = [IntervalVectors[12 - intervalClass], -1], record = _ref2[0], sign = _ref2[1];
  }
  intervals = _.extend({
    m3: 0,
    M3: 0,
    P5: 0,
    sign: 1
  }, record);
  for (k in intervals) {
    intervals[k] *= sign;
  }
  for (k in adjustments) {
    v = adjustments[k];
    intervals[k] += v;
  }
  computed_semitones = (12 + intervals.P5 * 7 + intervals.M3 * 4 + intervals.m3 * 3) % 12;
  if (computed_semitones !== original_intervalClass % 12) {
    console.error("Error computing grid position for " + original_intervalClass + ":\n", "  " + original_intervalClass + " ->", intervals, '->', computed_semitones, '!=', original_intervalClass % 12);
  }
  return intervals;
};

drawHarmonicTable = function(intervalClasses, options) {
  var bounds, cell_center, cell_radius, colors, hex_radius, interval_klass, x, y, _i, _len, _ref1;
  if (options == null) {
    options = {};
  }
  options = _.extend({
    draw: true
  }, DefaultStyle, options);
  colors = options.intervalClass_colors;
  if (__indexOf.call(intervalClasses, 0) < 0) {
    intervalClasses = [0].concat(intervalClasses);
  }
  cell_radius = options.radius;
  hex_radius = cell_radius / 2;
  cell_center = function(interval_klass) {
    var dx, dy, vectors, x, y;
    vectors = intervalClassVectors(interval_klass);
    dy = vectors.P5 + (vectors.M3 + vectors.m3) / 2;
    dx = vectors.M3 - vectors.m3;
    x = dx * cell_radius * .8;
    y = -dy * cell_radius * .95;
    return {
      x: x,
      y: y
    };
  };
  bounds = {
    left: Infinity,
    top: Infinity,
    right: -Infinity,
    bottom: -Infinity
  };
  for (_i = 0, _len = intervalClasses.length; _i < _len; _i++) {
    interval_klass = intervalClasses[_i];
    _ref1 = cell_center(interval_klass), x = _ref1.x, y = _ref1.y;
    bounds.left = Math.min(bounds.left, x - hex_radius);
    bounds.top = Math.min(bounds.top, y - hex_radius);
    bounds.right = Math.max(bounds.right, x + hex_radius);
    bounds.bottom = Math.max(bounds.bottom, y + hex_radius);
  }
  if (!options.draw) {
    return {
      width: bounds.right - bounds.left,
      height: bounds.bottom - bounds.top
    };
  }
  return withGraphicsContext(function(ctx) {
    var a, color, i, isRoot, label, pos, _fn, _j, _k, _l, _len1, _len2, _ref2, _ref3, _results;
    ctx.translate(-bounds.left, -bounds.bottom);
    _fn = function() {
      var dn, dx, dy, _ref2;
      _ref2 = [-y, x, 2 / Math.sqrt(x * x + y * y)], dx = _ref2[0], dy = _ref2[1], dn = _ref2[2];
      dx *= dn;
      dy *= dn;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(x + dx, y + dy);
      ctx.lineTo(x - dx, y - dy);
      ctx.fillStyle = color;
      return ctx.fill();
    };
    for (_j = 0, _len1 = intervalClasses.length; _j < _len1; _j++) {
      interval_klass = intervalClasses[_j];
      isRoot = interval_klass === 0;
      color = colors[interval_klass % 12];
      color || (color = colors[12 - interval_klass]);
      ctx.beginPath();
      _ref2 = cell_center(interval_klass), x = _ref2.x, y = _ref2.y;
      for (i = _k = 0; _k <= 6; i = ++_k) {
        a = i * Math.PI / 3;
        pos = [x + hex_radius * Math.cos(a), y + hex_radius * Math.sin(a)];
        if (i === 0) {
          ctx.moveTo.apply(ctx, pos);
        }
        ctx.lineTo.apply(ctx, pos);
      }
      ctx.strokeStyle = 'gray';
      ctx.stroke();
      if (isRoot || (options.fill_cells && interval_klass < 12)) {
        ctx.fillStyle = color || 'rgba(255,0,0,0.15)';
        if (!isRoot) {
          ctx.globalAlpha = 0.3;
        }
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (isRoot || options.fill_cells) {
        continue;
      }
      if (options.label_cells) {
        ctx.globalAlpha = 0.3;
      }
      _fn();
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, 2 * Math.PI, false);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, 2 * Math.PI, false);
    ctx.fillStyle = 'red';
    ctx.fill();
    if (options.label_cells) {
      _results = [];
      for (_l = 0, _len2 = intervalClasses.length; _l < _len2; _l++) {
        interval_klass = intervalClasses[_l];
        label = IntervalNames[interval_klass];
        if (interval_klass === 0) {
          label = 'R';
        }
        _ref3 = cell_center(interval_klass), x = _ref3.x, y = _ref3.y;
        _results.push(drawText(label, {
          font: '10pt Times',
          fillStyle: 'black',
          x: x,
          y: y,
          gravity: 'center'
        }));
      }
      return _results;
    }
  });
};

harmonicTableBlock = function(tones, options) {
  var dimensions;
  dimensions = drawHarmonicTable(tones, _.extend({}, options, {
    compute_bounds: true,
    draw: false
  }));
  return block({
    width: dimensions.width,
    height: dimensions.height,
    draw: function() {
      return drawHarmonicTable(tones, options);
    }
  });
};

module.exports = {
  draw: drawHarmonicTable,
  block: harmonicTableBlock
};


},{"./chord_diagram":"EHWjuh","./layout":"B83s2m","./theory":"80u6C5","underscore":24}],"B8u3u9":[function(require,module,exports){
var FretCount, FretNumbers, Instrument, intervalClassDifference, intervalPositionsFromRoot, pitchFromScientificNotation, _ref;

_ref = require('./theory'), intervalClassDifference = _ref.intervalClassDifference, pitchFromScientificNotation = _ref.pitchFromScientificNotation;

Instrument = (function() {
  function Instrument() {}

  Instrument.prototype.stringCount = 6;

  Instrument.prototype.strings = 6;

  Instrument.prototype.fretCount = 12;

  Instrument.prototype.stringNumbers = [0, 1, 2, 3, 4, 5];

  Instrument.prototype.stringPitches = 'E4 B3 G3 D3 A2 E2'.split(/\s/).reverse().map(pitchFromScientificNotation);

  Instrument.prototype.eachFingerPosition = function(fn) {
    var fret, string, _i, _len, _ref1, _results;
    _ref1 = this.stringNumbers;
    _results = [];
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      string = _ref1[_i];
      _results.push((function() {
        var _j, _ref2, _results1;
        _results1 = [];
        for (fret = _j = 0, _ref2 = this.fretCount; 0 <= _ref2 ? _j <= _ref2 : _j >= _ref2; fret = 0 <= _ref2 ? ++_j : --_j) {
          _results1.push(fn({
            string: string,
            fret: fret
          }));
        }
        return _results1;
      }).call(this));
    }
    return _results;
  };

  Instrument.prototype.pitchAt = function(_arg) {
    var fret, string;
    string = _arg.string, fret = _arg.fret;
    return this.stringPitches[string] + fret;
  };

  return Instrument;

})();

FretNumbers = [0, 1, 2, 3, 4];

FretCount = FretNumbers.length - 1;

intervalPositionsFromRoot = function(instrument, rootPosition, semitones) {
  var positions, rootPitch;
  rootPitch = instrument.pitchAt(rootPosition);
  positions = [];
  fretboard_positions_each(function(fingerPosition) {
    if (intervalClassDifference(rootPitch, instrument.pitchAt(fingerPosition)) !== semitones) {
      return;
    }
    return positions.push(fingerPosition);
  });
  return positions;
};

module.exports = {
  Default: new Instrument,
  FretNumbers: FretNumbers,
  FretCount: FretCount,
  intervalPositionsFromRoot: intervalPositionsFromRoot
};


},{"./theory":"80u6C5"}],"B83s2m":[function(require,module,exports){
var BuildDirectory, Canvas, Context, CurrentBook, CurrentPage, DefaultFilename, Mode, PaperSizes, TDLRLayout, above, box, directory, drawText, erase_background, filename, fs, get_page_size_dimensions, hbox, labeled, measure_text, overlay, padBox, path, save_canvas_to_png, textBox, util, vbox, withBook, withCanvas, withGraphicsContext, withGrid, withGridBoxes, withPage, write_pdf, _,
  __slice = [].slice;

fs = require('fs');

path = require('path');

util = require('util');

_ = require('underscore');

Canvas = require('canvas');

Context = {
  canvas: null,
  ctx: null
};

erase_background = function() {
  var canvas, ctx;
  canvas = Context.canvas, ctx = Context.ctx;
  ctx.fillStyle = 'white';
  return ctx.fillRect(0, 0, canvas.width, canvas.height);
};

measure_text = function(text, _arg) {
  var ctx, font;
  font = (_arg != null ? _arg : {}).font;
  ctx = Context.ctx;
  if (font) {
    ctx.font = font;
  }
  return ctx.measureText(text);
};

drawText = function(text, options) {
  var choice, ctx, fillStyle, font, gravity, m, width, x, y, _i, _len, _ref;
  if (options == null) {
    options = {};
  }
  ctx = Context.ctx;
  if (_.isObject(text)) {
    options = text;
  }
  font = options.font, fillStyle = options.fillStyle, x = options.x, y = options.y, gravity = options.gravity, width = options.width;
  gravity || (gravity = '');
  if (options.choices) {
    _ref = options.choices;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      choice = _ref[_i];
      if (_.isString(choice)) {
        text = choice;
      }
      if (_.isObject(choice)) {
        font = choice.font;
      }
      if (measure_text(text, {
        font: font
      }).width <= options.width) {
        break;
      }
    }
  }
  if (font) {
    ctx.font = font;
  }
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
  }
  m = ctx.measureText(text);
  x || (x = 0);
  y || (y = 0);
  if (gravity.match(/^(top|center|middle|centerbottom)$/i)) {
    x -= m.width / 2;
  }
  if (gravity.match(/^(right|topRight|botRight)$/i)) {
    x -= m.width;
  }
  if (gravity.match(/^(bottom|botLeft|botRight)$/i)) {
    y -= m.emHeightDescent;
  }
  if (gravity.match(/^(top|topLeft|topRight)$/i)) {
    y += m.emHeightAscent;
  }
  return ctx.fillText(text, x, y);
};

withCanvas = function(canvas, cb) {
  var savedCanvas, savedContext;
  savedCanvas = Context.canvas;
  savedContext = Context.context;
  try {
    Context.canvas = canvas;
    Context.ctx = canvas.getContext('2d');
    return cb();
  } finally {
    Context.canvas = savedCanvas;
    Context.context = savedContext;
  }
};

withGraphicsContext = function(fn) {
  var ctx;
  ctx = Context.ctx;
  ctx.save();
  try {
    return fn(ctx);
  } finally {
    ctx.restore();
  }
};

box = function(params) {
  var _ref, _ref1, _ref2;
  box = _.extend({
    width: 0
  }, params);
  if (box.height == null) {
    box.height = ((_ref = box.ascent) != null ? _ref : 0) + ((_ref1 = box.descent) != null ? _ref1 : 0);
  }
  if (box.ascent == null) {
    box.ascent = box.height - ((_ref2 = box.descent) != null ? _ref2 : 0);
  }
  if (box.descent == null) {
    box.descent = box.height - box.ascent;
  }
  return box;
};

padBox = function(box, options) {
  var _ref;
  if (options.bottom) {
    box.height += options.bottom;
  }
  if (options.bottom) {
    box.descent = ((_ref = box.descent) != null ? _ref : 0) + options.bottom;
  }
  return box;
};

textBox = function(text, options) {
  var measure;
  options = _.extend({}, options, {
    gravity: false
  });
  measure = measure_text(text, options);
  return box({
    width: measure.width,
    height: measure.emHeightAscent + measure.emHeightDescent,
    descent: measure.emHeightDescent,
    draw: function() {
      return drawText(text, options);
    }
  });
};

vbox = function() {
  var boxes, boxes_below, descent, height, options, width;
  boxes = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
  options = {};
  if (boxes[boxes.length - 1].width == null) {
    options = boxes.pop();
  }
  options = _.extend({
    align: 'left'
  }, options);
  width = Math.max.apply(Math, _.pluck(boxes, 'width'));
  height = _.pluck(boxes, 'height').reduce(function(a, b) {
    return a + b;
  });
  descent = boxes[boxes.length - 1].descent;
  if (options.baseline) {
    boxes_below = boxes.slice(boxes.indexOf(options.baseline) + 1);
    descent = options.baseline.descent + _.pluck(boxes_below, 'height').reduce((function(a, b) {
      return a + b;
    }), 0);
  }
  return box({
    width: width,
    height: height,
    descent: descent,
    draw: function() {
      var dy;
      dy = -height;
      return boxes.forEach(function(b1) {
        return withGraphicsContext(function(ctx) {
          var dx;
          dx = (function() {
            switch (options.align) {
              case 'left':
                return 0;
              case 'center':
                return Math.max(0, (width - b1.width) / 2);
            }
          })();
          ctx.translate(dx, dy + b1.height - b1.descent);
          if (typeof b1.draw === "function") {
            b1.draw(ctx);
          }
          return dy += b1.height;
        });
      });
    }
  });
};

above = vbox;

hbox = function(b1, b2) {
  var b, boxes, container_size, height, spring_count, width;
  container_size = (typeof CurrentBook !== "undefined" && CurrentBook !== null ? CurrentBook.page_options : void 0) || CurrentPage;
  boxes = [b1, b2];
  height = Math.max.apply(Math, _.pluck(boxes, 'height'));
  width = _.pluck(boxes, 'width').reduce(function(a, b) {
    return a + b;
  });
  if (width === Infinity) {
    width = container_size.width;
  }
  spring_count = ((function() {
    var _i, _len, _results;
    _results = [];
    for (_i = 0, _len = boxes.length; _i < _len; _i++) {
      b = boxes[_i];
      if (b.width === Infinity) {
        _results.push(b);
      }
    }
    return _results;
  })()).length;
  return box({
    width: width,
    height: height,
    draw: function() {
      var x;
      x = 0;
      return boxes.forEach(function(b) {
        withGraphicsContext(function(ctx) {
          ctx.translate(x, 0);
          return typeof b.draw === "function" ? b.draw(ctx) : void 0;
        });
        if (b.width === Infinity) {
          return x += (width - ((function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = boxes.length; _i < _len; _i++) {
              width = boxes[_i].width;
              if (width !== Infinity) {
                _results.push(width);
              }
            }
            return _results;
          })()).reduce(function(a, b) {
            return a + b;
          })) / spring_count;
        } else {
          return x += b.width;
        }
      });
    }
  });
};

overlay = function() {
  var boxes;
  boxes = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
  return box({
    width: Math.max.apply(Math, _.pluck(boxes, 'width')),
    height: Math.max.apply(Math, _.pluck(boxes, 'height')),
    draw: function() {
      var b, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = boxes.length; _i < _len; _i++) {
        b = boxes[_i];
        _results.push(withGraphicsContext(function(ctx) {
          return b.draw(ctx);
        }));
      }
      return _results;
    }
  });
};

labeled = function(text, options, box) {
  var default_options, _ref;
  if (arguments.length === 2) {
    _ref = [{}, options], options = _ref[0], box = _ref[1];
  }
  default_options = {
    font: '12px Times',
    fillStyle: 'black'
  };
  options = _.extend(default_options, options);
  return above(textBox(text, options), box, options);
};

withGridBoxes = function(options, generator) {
  var cell, cell_height, cell_width, cells, container_size, floor, header, line_break, max, max_descent, _i, _len;
  max = Math.max, floor = Math.floor;
  options = _.extend({
    header_height: 0,
    gutter_width: 10,
    gutter_height: 10
  }, options);
  container_size = (typeof CurrentBook !== "undefined" && CurrentBook !== null ? CurrentBook.page_options : void 0) || CurrentPage;
  line_break = {
    width: 0,
    height: 0,
    linebreak: true
  };
  header = null;
  cells = [];
  generator({
    header: function(box) {
      return header = box;
    },
    startRow: function() {
      return cells.push(line_break);
    },
    cell: function(box) {
      return cells.push(box);
    },
    cells: function(boxes) {
      var b, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = boxes.length; _i < _len; _i++) {
        b = boxes[_i];
        _results.push(cells.push(b));
      }
      return _results;
    }
  });
  cell_width = max.apply(null, _.pluck(cells, 'width'));
  cell_height = max.apply(null, _.pluck(cells, 'height'));
  _.extend(options, {
    header_height: (header != null ? header.height : void 0) || 0,
    cell_width: cell_width,
    cell_height: cell_height,
    cols: max(1, floor((container_size.width + options.gutter_width) / (cell_width + options.gutter_width)))
  });
  options.rows = (function() {
    var content_height;
    content_height = container_size.height - options.header_height;
    cell_height = cell_height + options.gutter_height;
    return max(1, floor((content_height + options.gutter_height) / cell_height));
  })();
  for (_i = 0, _len = cells.length; _i < _len; _i++) {
    cell = cells[_i];
    if (cell.descent == null) {
      cell.descent = 0;
    }
  }
  max_descent = max.apply(null, _.pluck(cells, 'descent'));
  return withGrid(options, function(grid) {
    if (header) {
      withGraphicsContext(function(ctx) {
        ctx.translate(0, header.height - header.descent);
        return header != null ? header.draw(ctx) : void 0;
      });
    }
    return cells.forEach(function(cell) {
      if (cell.linebreak != null) {
        grid.startRow();
      }
      if (cell === line_break) {
        return;
      }
      return grid.add_cell(function() {
        return withGraphicsContext(function(ctx) {
          ctx.translate(0, cell_height - cell.descent);
          return cell.draw(ctx);
        });
      });
    });
  });
};

BuildDirectory = '.';

DefaultFilename = null;

directory = function(path) {
  return BuildDirectory = path;
};

filename = function(name) {
  return DefaultFilename = name;
};

save_canvas_to_png = function(canvas, fname) {
  var out, stream;
  out = fs.createWriteStream(path.join(BuildDirectory, fname));
  stream = canvas.pngStream();
  stream.on('data', function(chunk) {
    return out.write(chunk);
  });
  return stream.on('end', function() {
    return console.info("Saved " + fname);
  });
};

PaperSizes = {
  folio: '12in x 15in',
  quarto: '9.5in x 12in',
  octavo: '6in x 9in',
  duodecimo: '5in x 7.375in',
  'ANSI A': '8.5in × 11in',
  'ANSI B': '11in x 17in',
  letter: 'ANSI A',
  ledger: 'ANSI B landscape',
  tabloid: 'ANSI B portrait',
  'ANSI C': '17in × 22in',
  'ANSI D': '22in × 34in',
  'ANSI E': '34in × 44in'
};

get_page_size_dimensions = function(size, orientation) {
  var height, parseMeasure, width, _ref, _ref1, _ref2, _ref3, _ref4;
  if (orientation == null) {
    orientation = null;
  }
  parseMeasure = function(measure) {
    var n, units, _ref;
    if (typeof measure === 'number') {
      return measure;
    }
    if (!measure.match(/^(\d+(?:\.\d*)?)\s*(.+)$/)) {
      throw new Error("Unrecognized measure " + (util.inspect(measure)) + " in " + (util.inspect(size)));
    }
    _ref = [Number(RegExp.$1), RegExp.$2], n = _ref[0], units = _ref[1];
    switch (units) {
      case "":
        return n;
      case "in":
        return n * 72;
      default:
        throw new Error("Unrecognized units " + (util.inspect(units)) + " in " + (util.inspect(size)));
    }
  };
  width = size.width, height = size.height;
  while (_.isString(size)) {
    if (size.match(/^(.+)\s+(landscape|portrait)$/)) {
      _ref = [RegExp.$1, RegExp.R2], size = _ref[0], orientation = _ref[1];
    }
    if (!(size in PaperSizes)) {
      break;
    }
    size = PaperSizes[size];
    width = size.width, height = size.height;
  }
  if (_.isString(size)) {
    if (!size.match(/^(.+?)\s*[x×]\s*(.+)$/)) {
      throw new Error("Unrecognized book size format " + (util.inspect(size)));
    }
    _ref1 = [RegExp.$1, RegExp.$2], width = _ref1[0], height = _ref1[1];
  }
  _ref2 = [parseMeasure(width), parseMeasure(height)], width = _ref2[0], height = _ref2[1];
  switch (orientation || '') {
    case 'landscape':
      if (!(width > height)) {
        _ref3 = [height, width], width = _ref3[0], height = _ref3[1];
      }
      break;
    case 'portrait':
      if (width > height) {
        _ref4 = [height, width], width = _ref4[0], height = _ref4[1];
      }
      break;
    case '':
      null;
      break;
    default:
      throw new Error("Unknown orientation " + (util.inspect(orientation)));
  }
  return {
    width: width,
    height: height
  };
};

(function() {
  var name, value, _results;
  _results = [];
  for (name in PaperSizes) {
    value = PaperSizes[name];
    _results.push(PaperSizes[name] = get_page_size_dimensions(value));
  }
  return _results;
})();

CurrentPage = null;

CurrentBook = null;

Mode = null;

_.mixin({
  sum: (function(plus) {
    return function(xs) {
      return _.reduce(xs, plus, 0);
    };
  })(function(a, b) {
    return a + b;
  })
});

TDLRLayout = function(boxes) {
  var ascent, b, descent, dx, dy, line, page_width, width, _i, _j, _len, _len1, _results;
  page_width = CurrentPage.width - CurrentPage.left_margin - CurrentPage.top_margin;
  boxes = boxes.slice(0);
  for (_i = 0, _len = boxes.length; _i < _len; _i++) {
    b = boxes[_i];
    if (b.descent == null) {
      b.descent = 0;
    }
  }
  dy = 0;
  width = 0;
  _results = [];
  while (boxes.length) {
    console.info('next', boxes.length);
    line = [];
    while (boxes.length) {
      b = boxes[0];
      if (width + b.width > page_width && line.length > 0) {
        break;
      }
      line.push(b);
      boxes.shift();
      width += b.width;
    }
    ascent = _.max((function() {
      var _j, _len1, _results1;
      _results1 = [];
      for (_j = 0, _len1 = line.length; _j < _len1; _j++) {
        b = line[_j];
        _results1.push(b.height - b.descent);
      }
      return _results1;
    })());
    descent = _.chain(line).pluck('descent').max();
    dx = 0;
    console.info('draw', line.length);
    for (_j = 0, _len1 = line.length; _j < _len1; _j++) {
      b = line[_j];
      withGraphicsContext(function(ctx) {
        ctx.translate(dx, dy + ascent);
        console.info('draw', dx, dy + ascent, b.draw);
        return b.draw(ctx);
      });
      dx += b.width;
    }
    _results.push(dy += ascent + descent);
  }
  return _results;
};

withPage = function(options, draw_page) {
  var bottom_margin, boxes, canvas, ctx, defaults, height, left_margin, page, page_margin, right_margin, top_margin, width, _ref;
  if (CurrentPage) {
    throw new Error("Already inside a page");
  }
  defaults = {
    width: 100,
    height: 100,
    page_margin: 10
  };
  _ref = _.extend(defaults, options), width = _ref.width, height = _ref.height, page_margin = _ref.page_margin;
  left_margin = options.left_margin, top_margin = options.top_margin, right_margin = options.right_margin, bottom_margin = options.bottom_margin;
  if (left_margin == null) {
    left_margin = page_margin;
  }
  if (top_margin == null) {
    top_margin = page_margin;
  }
  if (right_margin == null) {
    right_margin = page_margin;
  }
  if (bottom_margin == null) {
    bottom_margin = page_margin;
  }
  canvas = Context.canvas || (Context.canvas = new Canvas(width + left_margin + right_margin, height + top_margin + bottom_margin, Mode));
  ctx = Context.ctx = canvas.getContext('2d');
  if (Mode === 'pdf') {
    ctx.textDrawingMode = 'glyph';
  }
  boxes = [];
  try {
    page = {
      left_margin: left_margin,
      top_margin: top_margin,
      right_margin: right_margin,
      bottom_margin: bottom_margin,
      width: canvas.width,
      height: canvas.height,
      context: ctx,
      box: function(options) {
        return boxes.push(box(options));
      }
    };
    CurrentPage = page;
    erase_background();
    withGraphicsContext(function(ctx) {
      ctx.translate(left_margin, bottom_margin);
      if (CurrentBook != null) {
        if (typeof CurrentBook.header === "function") {
          CurrentBook.header(page);
        }
      }
      if (CurrentBook != null) {
        if (typeof CurrentBook.footer === "function") {
          CurrentBook.footer(page);
        }
      }
      if (typeof draw_page === "function") {
        draw_page(page);
      }
      return TDLRLayout(boxes);
    });
    switch (Mode) {
      case 'pdf':
        return ctx.addPage();
      default:
        filename = "" + (DefaultFilename || 'test') + ".png";
        fs.writeFile(path.join(BuildDirectory, filename), canvas.toBuffer());
        return console.info("Saved " + filename);
    }
  } finally {
    CurrentPage = null;
  }
};

withGrid = function(options, cb) {
  var cell, cell_height, cell_width, cols, defaults, gutter_height, gutter_width, header_height, overflow, rows, _i, _len, _results;
  defaults = {
    gutter_width: 10,
    gutter_height: 10,
    header_height: 0
  };
  options = _.extend(defaults, options);
  cols = options.cols, rows = options.rows, cell_width = options.cell_width, cell_height = options.cell_height, header_height = options.header_height, gutter_width = options.gutter_width, gutter_height = options.gutter_height;
  options.width || (options.width = cols * cell_width + (cols - 1) * gutter_width);
  options.height || (options.height = header_height + rows * cell_height + (rows - 1) * gutter_height);
  overflow = [];
  withPage(options, function(page) {
    return cb({
      context: page.context,
      rows: rows,
      cols: cols,
      row: 0,
      col: 0,
      add_cell: function(draw_fn) {
        var col, row, _ref, _ref1, _ref2;
        _ref = [this.col, this.row], col = _ref[0], row = _ref[1];
        if (row >= rows) {
          overflow.push({
            col: col,
            row: row,
            draw_fn: draw_fn
          });
        } else {
          withGraphicsContext(function(ctx) {
            ctx.translate(col * (cell_width + gutter_width), header_height + row * (cell_height + gutter_height));
            return draw_fn();
          });
        }
        col += 1;
        if (col >= cols) {
          _ref1 = [0, row + 1], col = _ref1[0], row = _ref1[1];
        }
        return _ref2 = [col, row], this.col = _ref2[0], this.row = _ref2[1], _ref2;
      },
      startRow: function() {
        var _ref;
        if (this.col > 0) {
          return _ref = [0, this.row + 1], this.col = _ref[0], this.row = _ref[1], _ref;
        }
      }
    });
  });
  _results = [];
  while (overflow.length) {
    for (_i = 0, _len = overflow.length; _i < _len; _i++) {
      cell = overflow[_i];
      cell.row -= rows;
    }
    withPage(options, function(page) {
      var col, draw_fn, row, _j, _len1, _ref, _ref1, _results1;
      _ref = _.select(overflow, function(cell) {
        return cell.row < rows;
      });
      _results1 = [];
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        _ref1 = _ref[_j], col = _ref1.col, row = _ref1.row, draw_fn = _ref1.draw_fn;
        _results1.push(withGraphicsContext(function(ctx) {
          ctx.translate(col * (cell_width + gutter_width), header_height + row * (cell_height + gutter_height));
          return draw_fn();
        }));
      }
      return _results1;
    });
    _results.push(overflow = (function() {
      var _j, _len1, _results1;
      _results1 = [];
      for (_j = 0, _len1 = overflow.length; _j < _len1; _j++) {
        cell = overflow[_j];
        if (cell.row >= rows) {
          _results1.push(cell);
        }
      }
      return _results1;
    })());
  }
  return _results;
};

withBook = function(filename, options, cb) {
  var book, canvas, ctx, height, page_count, page_limit, size, width, _ref, _ref1;
  if (CurrentBook) {
    throw new Error("withBook called recursively");
  }
  if (_.isFunction(options)) {
    _ref = [{}, options], options = _ref[0], cb = _ref[1];
  }
  page_limit = options.page_limit;
  page_count = 0;
  try {
    book = {
      page_options: {}
    };
    Mode = 'pdf';
    CurrentBook = book;
    size = options.size;
    if (size) {
      _ref1 = get_page_size_dimensions(size), width = _ref1.width, height = _ref1.height;
      _.extend(book.page_options, {
        width: width,
        height: height
      });
      canvas = Context.canvas || (Context.canvas = new Canvas(width, height, Mode));
      ctx = Context.ctx = canvas.getContext('2d');
      if (Mode === 'pdf') {
        ctx.textDrawingMode = 'glyph';
      }
    }
    cb({
      page_header: function(header) {
        return book.header = header;
      },
      page_footer: function(footer) {
        return book.footer = footer;
      },
      withPage: function(options, draw_page) {
        var _ref2;
        if (_.isFunction(options)) {
          _ref2 = [{}, options], options = _ref2[0], draw_page = _ref2[1];
        }
        if (this.done) {
          return;
        }
        options = _.extend({}, book.page_options, options);
        page_count += 1;
        if (CurrentPage) {
          draw_page(CurrentPage);
        } else {
          withPage(options, draw_page);
        }
        if (page_limit && page_limit <= page_count) {
          return this.done = true;
        }
      }
    });
    if (canvas) {
      return write_pdf(canvas, path.join(BuildDirectory, "" + filename + ".pdf"));
    } else {
      return console.warn("No pages");
    }
  } finally {
    CurrentBook = null;
    Mode = null;
    canvas = null;
    ctx = null;
  }
};

write_pdf = function(canvas, pathname) {
  return fs.writeFile(pathname, canvas.toBuffer(), function(err) {
    if (err) {
      return console.error("Error " + err.code + " writing to " + err.path);
    } else {
      return console.info("Saved " + pathname);
    }
  });
};

module.exports = {
  PaperSizes: PaperSizes,
  above: above,
  withBook: withBook,
  withGrid: withGrid,
  withGridBoxes: withGridBoxes,
  drawText: drawText,
  box: box,
  hbox: hbox,
  textBox: textBox,
  labeled: labeled,
  measure_text: measure_text,
  directory: directory,
  filename: filename,
  withGraphicsContext: withGraphicsContext,
  withCanvas: withCanvas
};


},{"canvas":"QgR0mD","fs":13,"path":18,"underscore":24,"util":19}],"e0n95g":[function(require,module,exports){
var ChordDiagramStyle, PI, block, cos, draw_pitch_diagram, max, min, pitch_diagram_block, sin, withGraphicsContext, _ref;

PI = Math.PI, cos = Math.cos, sin = Math.sin, min = Math.min, max = Math.max;

ChordDiagramStyle = require('./chord_diagram').defaultStyle;

_ref = require('./layout'), block = _ref.block, withGraphicsContext = _ref.withGraphicsContext;

draw_pitch_diagram = function(ctx, pitchClasses, options) {
  var angle, bounds, class_name, extend_bounds, m, pitchClass, pitch_class_angle, pitch_colors, pitch_names, r, r_label, x, y, _i, _j, _len, _len1;
  if (options == null) {
    options = {
      draw: true
    };
  }
  pitch_colors = options.pitch_colors, pitch_names = options.pitch_names;
  pitch_colors || (pitch_colors = ChordDiagramStyle.interval_class_colors);
  pitch_names || (pitch_names = 'R m2 M2 m3 M3 P4 TT P5 m6 M6 m7 M7'.split(/\s/));
  r = 10;
  r_label = r + 7;
  pitch_class_angle = function(pitchClass) {
    return (pitchClass - 3) * 2 * PI / 12;
  };
  bounds = {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0
  };
  extend_bounds = function(left, top, bottom, right) {
    bounds.left = min(bounds.left, left);
    bounds.top = min(bounds.top, top);
    bounds.right = max(bounds.right, right != null ? right : left);
    return bounds.bottom = max(bounds.bottom, bottom != null ? bottom : top);
  };
  for (_i = 0, _len = pitchClasses.length; _i < _len; _i++) {
    pitchClass = pitchClasses[_i];
    angle = pitch_class_angle(pitchClass);
    x = r * cos(angle);
    y = r * sin(angle);
    if (options.draw) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    extend_bounds(x, y);
    if (options.draw) {
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, 2 * PI, false);
      ctx.fillStyle = pitch_colors[pitchClass] || 'black';
      ctx.fill();
    }
  }
  ctx.font = '4pt Times';
  ctx.fillStyle = 'black';
  for (pitchClass = _j = 0, _len1 = pitch_names.length; _j < _len1; pitchClass = ++_j) {
    class_name = pitch_names[pitchClass];
    angle = pitch_class_angle(pitchClass);
    m = ctx.measureText(class_name);
    x = r_label * cos(angle) - m.width / 2;
    y = r_label * sin(angle) + m.emHeightDescent;
    if (options.draw) {
      ctx.fillText(class_name, x, y);
    }
    bounds.left = min(bounds.left, x);
    bounds.right = max(bounds.right, x + m.width);
    bounds.top = min(bounds.top, y - m.emHeightAscent);
    bounds.bottom = max(bounds.bottom, y + m.emHeightAscent);
  }
  return bounds;
};

pitch_diagram_block = function(pitchClasses, scale) {
  var bounds;
  if (scale == null) {
    scale = 1;
  }
  bounds = withGraphicsContext(function(ctx) {
    return draw_pitch_diagram(ctx, pitchClasses, {
      draw: false,
      measure: true
    });
  });
  return block({
    width: (bounds.right - bounds.left) * scale,
    height: (bounds.bottom - bounds.top) * scale,
    draw: function() {
      return withGraphicsContext(function(ctx) {
        ctx.scale(scale, scale);
        ctx.translate(-bounds.left, -bounds.bottom);
        return draw_pitch_diagram(ctx, pitchClasses);
      });
    }
  });
};

module.exports = {
  draw: draw_pitch_diagram,
  block: pitch_diagram_block
};


},{"./chord_diagram":"EHWjuh","./layout":"B83s2m"}],"80u6C5":[function(require,module,exports){
var AccidentalValues, Chord, ChordDefinitions, Chords, FlatNoteNames, FunctionQualities, Functions, IntervalNames, LongIntervalNames, Modes, NoteNames, Scale, Scales, SharpNoteNames, getPitchClassName, getPitchName, intervalClassDifference, normalizePitchClass, parseChordNumeral, parsePitchClass, pitchFromScientificNotation;

SharpNoteNames = 'C C# D D# E F F# G G# A A# B'.replace(/#/g, '\u266F').split(/\s/);

FlatNoteNames = 'C Db D Eb E F Gb G Ab A Bb B'.replace(/b/g, '\u266D').split(/\s/);

NoteNames = SharpNoteNames;

AccidentalValues = {
  '#': 1,
  '♯': 1,
  'b': -1,
  '♭': -1,
  '𝄪': 2,
  '𝄫': -2
};

IntervalNames = ['P1', 'm2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'];

LongIntervalNames = ['Unison', 'Minor 2nd', 'Major 2nd', 'Minor 3rd', 'Major 3rd', 'Perfect 4th', 'Tritone', 'Perfect 5th', 'Minor 6th', 'Major 6th', 'Minor 7th', 'Major 7th', 'Octave'];

getPitchClassName = function(pitchClass) {
  return NoteNames[normalizePitchClass(pitchClass)];
};

getPitchName = function(pitch) {
  if (typeof pitch === 'string') {
    return pitch;
  }
  return getPitchClassName(pitch);
};

intervalClassDifference = function(pca, pcb) {
  return normalizePitchClass(pcb - pca);
};

normalizePitchClass = function(pitchClass) {
  return ((pitchClass % 12) + 12) % 12;
};

pitchFromScientificNotation = function(name) {
  var accidentals, c, match, naturalName, octave, pitch, _i, _len, _ref;
  match = name.match(/^([A-G])([#♯b♭𝄪𝄫]*)(\d+)$/i);
  if (!match) {
    throw new Error("" + name + " is not in scientific notation");
  }
  _ref = match.slice(1), naturalName = _ref[0], accidentals = _ref[1], octave = _ref[2];
  pitch = SharpNoteNames.indexOf(naturalName.toUpperCase()) + 12 * (1 + Number(octave));
  for (_i = 0, _len = accidentals.length; _i < _len; _i++) {
    c = accidentals[_i];
    pitch += AccidentalValues[c];
  }
  return pitch;
};

parsePitchClass = function(name) {
  var accidentals, c, match, naturalName, pitch, _i, _len, _ref;
  match = name.match(/^([A-G])([#♯b♭𝄪𝄫]*)$/i);
  if (!match) {
    throw new Error("" + name + " is not a pitch class name");
  }
  _ref = match.slice(1), naturalName = _ref[0], accidentals = _ref[1];
  pitch = SharpNoteNames.indexOf(naturalName.toUpperCase());
  for (_i = 0, _len = accidentals.length; _i < _len; _i++) {
    c = accidentals[_i];
    pitch += AccidentalValues[c];
  }
  return pitch;
};

Scale = (function() {
  function Scale(_arg) {
    this.name = _arg.name, this.pitches = _arg.pitches, this.tonicName = _arg.tonicName;
    if (this.tonicName) {
      this.tonicPitch || (this.tonicPitch = parsePitchClass(this.tonicName));
    }
  }

  Scale.prototype.at = function(tonicName) {
    return new Scale({
      name: this.name,
      pitches: this.pitches,
      tonicName: tonicName
    });
  };

  Scale.prototype.chords = function(options) {
    var degree, degrees, i, noteNames, pitches, _i, _ref, _results,
      _this = this;
    if (options == null) {
      options = {};
    }
    if (this.tonicPitch == null) {
      throw new Error("only implemented for scales with tonics");
    }
    noteNames = SharpNoteNames;
    if (noteNames.indexOf(this.tonicName) < 0 || this.tonicName === 'F') {
      noteNames = FlatNoteNames;
    }
    degrees = [0, 2, 4];
    if (options.sevenths) {
      degrees.push(6);
    }
    _results = [];
    for (i = _i = 0, _ref = this.pitches.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      pitches = this.pitches.slice(i).concat(this.pitches.slice(0, i));
      pitches = ((function() {
        var _j, _len, _results1;
        _results1 = [];
        for (_j = 0, _len = degrees.length; _j < _len; _j++) {
          degree = degrees[_j];
          _results1.push(pitches[degree]);
        }
        return _results1;
      })()).map(function(n) {
        return (n + _this.tonicPitch) % 12;
      });
      _results.push(Chord.fromPitches(pitches).enharmonicizeTo(noteNames));
    }
    return _results;
  };

  Scale.find = function(tonicName) {
    var scaleName;
    scaleName = 'Diatonic Major';
    return Scales[scaleName].at(tonicName);
  };

  return Scale;

})();

Scales = (function() {
  var name, pitches, scale_specs, spec, _i, _len, _ref, _results;
  scale_specs = ['Diatonic Major: 024579e', 'Natural Minor: 023578t', 'Melodic Minor: 023579e', 'Harmonic Minor: 023578e', 'Pentatonic Major: 02479', 'Pentatonic Minor: 0357t', 'Blues: 03567t', 'Freygish: 014578t', 'Whole Tone: 02468t', 'Octatonic: 0235689e'];
  _results = [];
  for (_i = 0, _len = scale_specs.length; _i < _len; _i++) {
    spec = scale_specs[_i];
    _ref = spec.split(/:\s*/, 2), name = _ref[0], pitches = _ref[1];
    pitches = pitches.match(/./g).map(function(c) {
      return {
        't': 10,
        'e': 11
      }[c] || Number(c);
    });
    _results.push(new Scale({
      name: name,
      pitches: pitches
    }));
  }
  return _results;
})();

(function() {
  var scale, _i, _len, _results;
  _results = [];
  for (_i = 0, _len = Scales.length; _i < _len; _i++) {
    scale = Scales[_i];
    _results.push(Scales[scale.name] = scale);
  }
  return _results;
})();

Modes = (function() {
  var d, delta, i, modeNames, name, pitches, rootTones, _i, _len, _results;
  rootTones = Scales['Diatonic Major'].pitches;
  modeNames = 'Ionian Dorian Phrygian Lydian Mixolydian Aeolian Locrian'.split(/\s/);
  _results = [];
  for (i = _i = 0, _len = rootTones.length; _i < _len; i = ++_i) {
    delta = rootTones[i];
    name = modeNames[i];
    pitches = (function() {
      var _j, _len1, _ref, _results1;
      _ref = rootTones.slice(i).concat(rootTones.slice(0, i));
      _results1 = [];
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        d = _ref[_j];
        _results1.push((d - delta + 12) % 12);
      }
      return _results1;
    })();
    _results.push(new Scale({
      name: name,
      pitches: pitches
    }));
  }
  return _results;
})();

(function() {
  var mode, _i, _len, _results;
  _results = [];
  for (_i = 0, _len = Modes.length; _i < _len; _i++) {
    mode = Modes[_i];
    _results.push(Modes[mode.name] = mode);
  }
  return _results;
})();

Functions = 'Tonic Supertonic Mediant Subdominant Dominant Submediant Subtonic Leading'.split(/\s/);

parseChordNumeral = function(name) {
  var chord;
  chord = {
    degree: 'i ii iii iv v vi vii'.indexOf(name.match(/[iv+]/i)[1]) + 1,
    major: name === name.toUpperCase(),
    flat: name.match(/^b/),
    diminished: name.match(/°/),
    augmented: name.match(/\+/)
  };
  return chord;
};

FunctionQualities = {
  major: 'I ii iii IV V vi vii°'.split(/\s/).map(parseChordNumeral),
  minor: 'i ii° bIII iv v bVI bVII'.split(/\s/).map(parseChordNumeral)
};

Chord = (function() {
  function Chord(_arg) {
    var degree, degrees, i, pc, pci, rootlessAbbr, rootlessFullName;
    this.name = _arg.name, this.fullName = _arg.fullName, this.abbr = _arg.abbr, this.abbrs = _arg.abbrs, this.pitchClasses = _arg.pitchClasses, this.rootName = _arg.rootName, this.rootPitch = _arg.rootPitch;
    if (this.abbrs == null) {
      this.abbrs = [this.abbr];
    }
    if (typeof this.abbrs === 'string') {
      this.abbrs = this.abbrs.split(/s/);
    }
    if (this.abbr == null) {
      this.abbr = this.abbrs[0];
    }
    if (this.rootPitch != null) {
      this.rootName || (this.rootName = NoteNames[this.rootPitch]);
    }
    if (this.rootName != null) {
      if (this.rootPitch == null) {
        this.rootPitch = parsePitchClass(this.rootName);
      }
      rootlessAbbr = this.abbr;
      rootlessFullName = this.fullName;
      Object.defineProperty(this, 'name', {
        get: function() {
          return "" + this.rootName + rootlessAbbr;
        }
      });
      Object.defineProperty(this, 'fullName', {
        get: function() {
          return "" + this.rootName + " " + rootlessFullName;
        }
      });
    }
    degrees = (function() {
      var _i, _ref, _results;
      _results = [];
      for (i = _i = 0, _ref = this.pitchClasses.length; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
        _results.push(1 + 2 * i);
      }
      return _results;
    }).call(this);
    degrees[1] = {
      'Sus2': 2,
      'Sus4': 4
    }[this.name] || degrees[1];
    if (this.name.match(/6/)) {
      degrees[3] = 6;
    }
    this.components = (function() {
      var _i, _len, _ref, _ref1, _ref2, _ref3, _results;
      _ref = this.pitchClasses;
      _results = [];
      for (pci = _i = 0, _len = _ref.length; _i < _len; pci = ++_i) {
        pc = _ref[pci];
        name = IntervalNames[pc];
        degree = degrees[pci];
        if (pc === 0) {
          name = 'R';
        } else if (Number((_ref1 = name.match(/\d+/)) != null ? _ref1[0] : void 0) !== degree) {
          if (Number((_ref2 = IntervalNames[pc - 1].match(/\d+/)) != null ? _ref2[0] : void 0) === degree) {
            name = "A" + degree;
          }
          if (Number((_ref3 = IntervalNames[pc + 1].match(/\d+/)) != null ? _ref3[0] : void 0) === degree) {
            name = "d" + degree;
          }
        }
        _results.push(name);
      }
      return _results;
    }).call(this);
  }

  Chord.prototype.at = function(rootNameOrPitch) {
    var rootName, rootPitch, _ref;
    _ref = (function() {
      switch (typeof rootNameOrPitch) {
        case 'string':
          return [rootNameOrPitch, null];
        case 'number':
          return [null, rootNameOrPitch];
        default:
          throw new Error("#rootNameOrPitch} must be a pitch name or number");
      }
    })(), rootName = _ref[0], rootPitch = _ref[1];
    return new Chord({
      name: this.name,
      abbrs: this.abbrs,
      fullName: this.fullName,
      pitchClasses: this.pitchClasses,
      rootName: rootName,
      rootPitch: rootPitch
    });
  };

  Chord.prototype.degreeName = function(degreeIndex) {
    return this.components[degreeIndex];
  };

  Chord.prototype.enharmonicizeTo = function(pitchNameArray) {
    var pitchClass, pitchName, _i, _len;
    for (pitchClass = _i = 0, _len = pitchNameArray.length; _i < _len; pitchClass = ++_i) {
      pitchName = pitchNameArray[pitchClass];
      if (this.rootPitch === pitchClass) {
        this.rootName = pitchName;
      }
    }
    return this;
  };

  Chord.find = function(name) {
    var chordName, match, noteName, _ref;
    match = name.match(/^([a-gA-G][#b♯♭]*)(.*)$/);
    if (!match) {
      throw new Error("" + name + " is not a chord name");
    }
    _ref = match.slice(1), noteName = _ref[0], chordName = _ref[1];
    if (!Chords[chordName]) {
      throw new Error("" + name + " is not a chord name");
    }
    return Chords[chordName].at(noteName);
  };

  Chord.fromPitches = function(pitches) {
    var pitch, root;
    root = pitches[0];
    return Chord.fromPitchClasses((function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = pitches.length; _i < _len; _i++) {
        pitch = pitches[_i];
        _results.push(pitch - root);
      }
      return _results;
    })()).at(root);
  };

  Chord.fromPitchClasses = function(pitchClasses) {
    var chord, n;
    pitchClasses = ((function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = pitchClasses.length; _i < _len; _i++) {
        n = pitchClasses[_i];
        _results.push((n + 12) % 12);
      }
      return _results;
    })()).sort(function(a, b) {
      return a > b;
    });
    chord = Chords[pitchClasses];
    if (!chord) {
      throw new Error("Couldn''t find chord with pitch classes " + pitchClasses);
    }
    return chord;
  };

  return Chord;

})();

ChordDefinitions = [
  {
    name: 'Major',
    abbrs: ['', 'M'],
    pitchClasses: '047'
  }, {
    name: 'Minor',
    abbr: 'm',
    pitchClasses: '037'
  }, {
    name: 'Augmented',
    abbrs: ['+', 'aug'],
    pitchClasses: '048'
  }, {
    name: 'Diminished',
    abbrs: ['°', 'dim'],
    pitchClasses: '036'
  }, {
    name: 'Sus2',
    abbr: 'sus2',
    pitchClasses: '027'
  }, {
    name: 'Sus4',
    abbr: 'sus4',
    pitchClasses: '057'
  }, {
    name: 'Dominant 7th',
    abbrs: ['7', 'dom7'],
    pitchClasses: '047t'
  }, {
    name: 'Augmented 7th',
    abbrs: ['+7', '7aug'],
    pitchClasses: '048t'
  }, {
    name: 'Diminished 7th',
    abbrs: ['°7', 'dim7'],
    pitchClasses: '0369'
  }, {
    name: 'Major 7th',
    abbr: 'maj7',
    pitchClasses: '047e'
  }, {
    name: 'Minor 7th',
    abbr: 'min7',
    pitchClasses: '037t'
  }, {
    name: 'Dominant 7b5',
    abbr: '7b5',
    pitchClasses: '046t'
  }, {
    name: 'Minor 7th b5',
    abbrs: ['ø', 'Ø', 'm7b5'],
    pitchClasses: '036t'
  }, {
    name: 'Diminished Maj 7th',
    abbr: '°Maj7',
    pitchClasses: '036e'
  }, {
    name: 'Minor-Major 7th',
    abbrs: ['min/maj7', 'min(maj7)'],
    pitchClasses: '037e'
  }, {
    name: '6th',
    abbrs: ['6', 'M6', 'M6', 'maj6'],
    pitchClasses: '0479'
  }, {
    name: 'Minor 6th',
    abbrs: ['m6', 'min6'],
    pitchClasses: '0379'
  }
];

Chords = ChordDefinitions.map(function(spec) {
  spec.fullName = spec.name;
  spec.name = spec.name.replace(/Major(?!$)/, 'Maj').replace(/Minor(?!$)/, 'Min').replace('Dominant', 'Dom').replace('Diminished', 'Dim');
  spec.abbrs || (spec.abbrs = [spec.abbr]);
  if (typeof spec.abbrs === 'string') {
    spec.abbrs = spec.abbrs.split(/s/);
  }
  spec.abbr || (spec.abbr = spec.abbrs[0]);
  spec.pitchClasses = spec.pitchClasses.match(/./g).map(function(c) {
    return {
      't': 10,
      'e': 11
    }[c] || Number(c);
  });
  return new Chord(spec);
});

(function() {
  var abbrs, chord, fullName, key, name, _i, _j, _len, _len1, _ref, _results;
  _results = [];
  for (_i = 0, _len = Chords.length; _i < _len; _i++) {
    chord = Chords[_i];
    name = chord.name, fullName = chord.fullName, abbrs = chord.abbrs;
    _ref = [name, fullName].concat(abbrs);
    for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
      key = _ref[_j];
      Chords[key] = chord;
    }
    _results.push(Chords[chord.pitchClasses] = chord);
  }
  return _results;
})();

module.exports = {
  Chord: Chord,
  Chords: Chords,
  IntervalNames: IntervalNames,
  LongIntervalNames: LongIntervalNames,
  Modes: Modes,
  NoteNames: NoteNames,
  Scale: Scale,
  Scales: Scales,
  getPitchClassName: getPitchClassName,
  intervalClassDifference: intervalClassDifference,
  pitchFromScientificNotation: pitchFromScientificNotation
};


},{}],"+Nu4mz":[function(require,module,exports){
var hsv2css, hsv2rgb, rgb2css, _base, _base1;

(_base = Function.prototype).define || (_base.define = function(name, desc) {
  return Object.defineProperty(this.prototype, name, desc);
});

(_base1 = Function.prototype).cached_getter || (_base1.cached_getter = function(name, fn) {
  return Object.defineProperty(this.prototype, name, {
    get: function() {
      var cache;
      cache = this._getter_cache || (this._getter_cache = {});
      if (name in cache) {
        return cache[name];
      }
      return cache[name] = fn.call(this);
    }
  });
});

hsv2rgb = function(_arg) {
  var b, c, component, components, g, h, r, s, v, x, _ref;
  h = _arg.h, s = _arg.s, v = _arg.v;
  h /= 360;
  c = v * s;
  x = c * (1 - Math.abs((h * 6) % 2 - 1));
  components = (function() {
    switch (Math.floor(h * 6) % 6) {
      case 0:
        return [c, x, 0];
      case 1:
        return [x, c, 0];
      case 2:
        return [0, c, x];
      case 3:
        return [0, x, c];
      case 4:
        return [x, 0, c];
      case 5:
        return [c, 0, x];
    }
  })();
  _ref = (function() {
    var _i, _len, _results;
    _results = [];
    for (_i = 0, _len = components.length; _i < _len; _i++) {
      component = components[_i];
      _results.push(component + v - c);
    }
    return _results;
  })(), r = _ref[0], g = _ref[1], b = _ref[2];
  return {
    r: r,
    g: g,
    b: b
  };
};

rgb2css = function(_arg) {
  var b, c, g, r, _ref;
  r = _arg.r, g = _arg.g, b = _arg.b;
  _ref = (function() {
    var _i, _len, _ref, _results;
    _ref = [r, g, b];
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      c = _ref[_i];
      _results.push(Math.floor(255 * c));
    }
    return _results;
  })(), r = _ref[0], g = _ref[1], b = _ref[2];
  return "rgb(" + r + ", " + g + ", " + b + ")";
};

hsv2css = function(hsv) {
  return rgb2css(hsv2rgb(hsv));
};

module.exports = {
  hsv2css: hsv2css,
  hsv2rgb: hsv2rgb,
  rgb2css: rgb2css
};


},{}],12:[function(require,module,exports){
var process=require("__browserify_process");if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    }
;
function indexOf (xs, x) {
    if (xs.indexOf) return xs.indexOf(x);
    for (var i = 0; i < xs.length; i++) {
        if (x === xs[i]) return i;
    }
    return -1;
}

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = indexOf(list, listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  if (arguments.length === 0) {
    this._events = {};
    return this;
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (typeof emitter._events[type] === 'function')
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

},{"__browserify_process":23}],13:[function(require,module,exports){
// nothing to see here... no file methods for the browser

},{}],"./harmonic_table":[function(require,module,exports){
module.exports=require('NBDcvj');
},{}],"./theory":[function(require,module,exports){
module.exports=require('80u6C5');
},{}],"./fretboard_diagram":[function(require,module,exports){
module.exports=require('V9DGE2');
},{}],"canvas":[function(require,module,exports){
module.exports=require('QgR0mD');
},{}],18:[function(require,module,exports){
var process=require("__browserify_process");function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';

},{"__browserify_process":23}],19:[function(require,module,exports){
var events = require('events');

exports.isArray = isArray;
exports.isDate = function(obj){return Object.prototype.toString.call(obj) === '[object Date]'};
exports.isRegExp = function(obj){return Object.prototype.toString.call(obj) === '[object RegExp]'};


exports.print = function () {};
exports.puts = function () {};
exports.debug = function() {};

exports.inspect = function(obj, showHidden, depth, colors) {
  var seen = [];

  var stylize = function(str, styleType) {
    // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
    var styles =
        { 'bold' : [1, 22],
          'italic' : [3, 23],
          'underline' : [4, 24],
          'inverse' : [7, 27],
          'white' : [37, 39],
          'grey' : [90, 39],
          'black' : [30, 39],
          'blue' : [34, 39],
          'cyan' : [36, 39],
          'green' : [32, 39],
          'magenta' : [35, 39],
          'red' : [31, 39],
          'yellow' : [33, 39] };

    var style =
        { 'special': 'cyan',
          'number': 'blue',
          'boolean': 'yellow',
          'undefined': 'grey',
          'null': 'bold',
          'string': 'green',
          'date': 'magenta',
          // "name": intentionally not styling
          'regexp': 'red' }[styleType];

    if (style) {
      return '\u001b[' + styles[style][0] + 'm' + str +
             '\u001b[' + styles[style][1] + 'm';
    } else {
      return str;
    }
  };
  if (! colors) {
    stylize = function(str, styleType) { return str; };
  }

  function format(value, recurseTimes) {
    // Provide a hook for user-specified inspect functions.
    // Check that value is an object with an inspect function on it
    if (value && typeof value.inspect === 'function' &&
        // Filter out the util module, it's inspect function is special
        value !== exports &&
        // Also filter out any prototype objects using the circular check.
        !(value.constructor && value.constructor.prototype === value)) {
      return value.inspect(recurseTimes);
    }

    // Primitive types cannot have properties
    switch (typeof value) {
      case 'undefined':
        return stylize('undefined', 'undefined');

      case 'string':
        var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                                 .replace(/'/g, "\\'")
                                                 .replace(/\\"/g, '"') + '\'';
        return stylize(simple, 'string');

      case 'number':
        return stylize('' + value, 'number');

      case 'boolean':
        return stylize('' + value, 'boolean');
    }
    // For some reason typeof null is "object", so special case here.
    if (value === null) {
      return stylize('null', 'null');
    }

    // Look up the keys of the object.
    var visible_keys = Object_keys(value);
    var keys = showHidden ? Object_getOwnPropertyNames(value) : visible_keys;

    // Functions without properties can be shortcutted.
    if (typeof value === 'function' && keys.length === 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        var name = value.name ? ': ' + value.name : '';
        return stylize('[Function' + name + ']', 'special');
      }
    }

    // Dates without properties can be shortcutted
    if (isDate(value) && keys.length === 0) {
      return stylize(value.toUTCString(), 'date');
    }

    var base, type, braces;
    // Determine the object type
    if (isArray(value)) {
      type = 'Array';
      braces = ['[', ']'];
    } else {
      type = 'Object';
      braces = ['{', '}'];
    }

    // Make functions say that they are functions
    if (typeof value === 'function') {
      var n = value.name ? ': ' + value.name : '';
      base = (isRegExp(value)) ? ' ' + value : ' [Function' + n + ']';
    } else {
      base = '';
    }

    // Make dates with properties first say the date
    if (isDate(value)) {
      base = ' ' + value.toUTCString();
    }

    if (keys.length === 0) {
      return braces[0] + base + braces[1];
    }

    if (recurseTimes < 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        return stylize('[Object]', 'special');
      }
    }

    seen.push(value);

    var output = keys.map(function(key) {
      var name, str;
      if (value.__lookupGetter__) {
        if (value.__lookupGetter__(key)) {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Getter/Setter]', 'special');
          } else {
            str = stylize('[Getter]', 'special');
          }
        } else {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Setter]', 'special');
          }
        }
      }
      if (visible_keys.indexOf(key) < 0) {
        name = '[' + key + ']';
      }
      if (!str) {
        if (seen.indexOf(value[key]) < 0) {
          if (recurseTimes === null) {
            str = format(value[key]);
          } else {
            str = format(value[key], recurseTimes - 1);
          }
          if (str.indexOf('\n') > -1) {
            if (isArray(value)) {
              str = str.split('\n').map(function(line) {
                return '  ' + line;
              }).join('\n').substr(2);
            } else {
              str = '\n' + str.split('\n').map(function(line) {
                return '   ' + line;
              }).join('\n');
            }
          }
        } else {
          str = stylize('[Circular]', 'special');
        }
      }
      if (typeof name === 'undefined') {
        if (type === 'Array' && key.match(/^\d+$/)) {
          return str;
        }
        name = JSON.stringify('' + key);
        if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
          name = name.substr(1, name.length - 2);
          name = stylize(name, 'name');
        } else {
          name = name.replace(/'/g, "\\'")
                     .replace(/\\"/g, '"')
                     .replace(/(^"|"$)/g, "'");
          name = stylize(name, 'string');
        }
      }

      return name + ': ' + str;
    });

    seen.pop();

    var numLinesEst = 0;
    var length = output.reduce(function(prev, cur) {
      numLinesEst++;
      if (cur.indexOf('\n') >= 0) numLinesEst++;
      return prev + cur.length + 1;
    }, 0);

    if (length > 50) {
      output = braces[0] +
               (base === '' ? '' : base + '\n ') +
               ' ' +
               output.join(',\n  ') +
               ' ' +
               braces[1];

    } else {
      output = braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
    }

    return output;
  }
  return format(obj, (typeof depth === 'undefined' ? 2 : depth));
};


function isArray(ar) {
  return Array.isArray(ar) ||
         (typeof ar === 'object' && Object.prototype.toString.call(ar) === '[object Array]');
}


function isRegExp(re) {
  typeof re === 'object' && Object.prototype.toString.call(re) === '[object RegExp]';
}


function isDate(d) {
  return typeof d === 'object' && Object.prototype.toString.call(d) === '[object Date]';
}

function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}

var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}

exports.log = function (msg) {};

exports.pump = null;

var Object_keys = Object.keys || function (obj) {
    var res = [];
    for (var key in obj) res.push(key);
    return res;
};

var Object_getOwnPropertyNames = Object.getOwnPropertyNames || function (obj) {
    var res = [];
    for (var key in obj) {
        if (Object.hasOwnProperty.call(obj, key)) res.push(key);
    }
    return res;
};

var Object_create = Object.create || function (prototype, properties) {
    // from es5-shim
    var object;
    if (prototype === null) {
        object = { '__proto__' : null };
    }
    else {
        if (typeof prototype !== 'object') {
            throw new TypeError(
                'typeof prototype[' + (typeof prototype) + '] != \'object\''
            );
        }
        var Type = function () {};
        Type.prototype = prototype;
        object = new Type();
        object.__proto__ = prototype;
    }
    if (typeof properties !== 'undefined' && Object.defineProperties) {
        Object.defineProperties(object, properties);
    }
    return object;
};

exports.inherits = function(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object_create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (typeof f !== 'string') {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(exports.inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j': return JSON.stringify(args[i++]);
      default:
        return x;
    }
  });
  for(var x = args[i]; i < len; x = args[++i]){
    if (x === null || typeof x !== 'object') {
      str += ' ' + x;
    } else {
      str += ' ' + exports.inspect(x);
    }
  }
  return str;
};

},{"events":12}],"./utils":[function(require,module,exports){
module.exports=require('+Nu4mz');
},{}],"./layout":[function(require,module,exports){
module.exports=require('B83s2m');
},{}],"./chord_diagram":[function(require,module,exports){
module.exports=require('EHWjuh');
},{}],23:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],24:[function(require,module,exports){
//     Underscore.js 1.4.4
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var push             = ArrayProto.push,
      slice            = ArrayProto.slice,
      concat           = ArrayProto.concat,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.4.4';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs, first) {
    if (_.isEmpty(attrs)) return first ? null : [];
    return _[first ? 'find' : 'filter'](obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.where(obj, attrs, true);
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See: https://bugs.webkit.org/show_bug.cgi?id=80797
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        index : index,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index < right.index ? -1 : 1;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(obj, value, context, behavior) {
    var result = {};
    var iterator = lookupIterator(value || _.identity);
    each(obj, function(value, index) {
      var key = iterator.call(context, value, index, obj);
      behavior(result, key, value);
    });
    return result;
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key, value) {
      (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
    });
  };

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key) {
      if (!_.has(result, key)) result[key] = 0;
      result[key]++;
    });
  };

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    each(input, function(value) {
      if (_.isArray(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(concat.apply(ArrayProto, arguments));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(args, "" + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, l = list.length; i < l; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, l = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < l; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    var args = slice.call(arguments, 2);
    return function() {
      return func.apply(context, args.concat(slice.call(arguments)));
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context.
  _.partial = function(func) {
    var args = slice.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, result;
    var previous = 0;
    var later = function() {
      previous = new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, result;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) result = func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var values = [];
    for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var pairs = [];
    for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] == null) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent, but `Object`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                               _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
        return false;
      }
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(n);
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named property is a function then invoke it;
  // otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);

},{}],"./instruments":[function(require,module,exports){
module.exports=require('B8u3u9');
},{}],"./fingerings":[function(require,module,exports){
module.exports=require('/X1WgR');
},{}],"./pitch_diagram":[function(require,module,exports){
module.exports=require('e0n95g');
},{}]},{},[1,"QgR0mD","EHWjuh","/X1WgR","V9DGE2","NBDcvj","B8u3u9","B83s2m","e0n95g","80u6C5","+Nu4mz"])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvb3N0ZWVsZS9Db2RlL2ZyZXRib2FyZC9hcHAvanMvYXBwLmNvZmZlZSIsIi9Vc2Vycy9vc3RlZWxlL0NvZGUvZnJldGJvYXJkL2xpYi9icm93c2VyL2NhbnZhcy5jb2ZmZWUiLCIvVXNlcnMvb3N0ZWVsZS9Db2RlL2ZyZXRib2FyZC9saWIvY2hvcmRfZGlhZ3JhbS5jb2ZmZWUiLCIvVXNlcnMvb3N0ZWVsZS9Db2RlL2ZyZXRib2FyZC9saWIvZmluZ2VyaW5ncy5jb2ZmZWUiLCIvVXNlcnMvb3N0ZWVsZS9Db2RlL2ZyZXRib2FyZC9saWIvZnJldGJvYXJkX2RpYWdyYW0uY29mZmVlIiwiL1VzZXJzL29zdGVlbGUvQ29kZS9mcmV0Ym9hcmQvbGliL2hhcm1vbmljX3RhYmxlLmNvZmZlZSIsIi9Vc2Vycy9vc3RlZWxlL0NvZGUvZnJldGJvYXJkL2xpYi9pbnN0cnVtZW50cy5jb2ZmZWUiLCIvVXNlcnMvb3N0ZWVsZS9Db2RlL2ZyZXRib2FyZC9saWIvbGF5b3V0LmNvZmZlZSIsIi9Vc2Vycy9vc3RlZWxlL0NvZGUvZnJldGJvYXJkL2xpYi9waXRjaF9kaWFncmFtLmNvZmZlZSIsIi9Vc2Vycy9vc3RlZWxlL0NvZGUvZnJldGJvYXJkL2xpYi90aGVvcnkuY29mZmVlIiwiL1VzZXJzL29zdGVlbGUvQ29kZS9mcmV0Ym9hcmQvbGliL3V0aWxzLmNvZmZlZSIsIi9Vc2Vycy9vc3RlZWxlL0NvZGUvZnJldGJvYXJkL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLWJ1aWx0aW5zL2J1aWx0aW4vZXZlbnRzLmpzIiwiL1VzZXJzL29zdGVlbGUvQ29kZS9mcmV0Ym9hcmQvbm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItYnVpbHRpbnMvYnVpbHRpbi9mcy5qcyIsIi9Vc2Vycy9vc3RlZWxlL0NvZGUvZnJldGJvYXJkL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLWJ1aWx0aW5zL2J1aWx0aW4vcGF0aC5qcyIsIi9Vc2Vycy9vc3RlZWxlL0NvZGUvZnJldGJvYXJkL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLWJ1aWx0aW5zL2J1aWx0aW4vdXRpbC5qcyIsIi9Vc2Vycy9vc3RlZWxlL0NvZGUvZnJldGJvYXJkL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbnNlcnQtbW9kdWxlLWdsb2JhbHMvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIi9Vc2Vycy9vc3RlZWxlL0NvZGUvZnJldGJvYXJkL25vZGVfbW9kdWxlcy91bmRlcnNjb3JlL3VuZGVyc2NvcmUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLElBQUEsdUZBQUE7O0FBQUEsQ0FBQSxFQUFlLElBQUEsS0FBZixLQUFlOztBQUNmLENBREEsRUFDUyxHQUFULENBQVMsR0FBQTs7QUFDVCxDQUZBLEVBRWMsSUFBQSxJQUFkLElBQWM7O0FBQ2IsQ0FIRCxFQUdvQixJQUFBLE9BQUEsQ0FIcEI7O0FBS0EsQ0FMQSxDQU1FLEdBREYsQ0FBQSxDQUtJLEdBQUE7O0FBSUosQ0FkQSxFQWNnQyxFQUFoQyxFQUFPLENBQVAsQ0FBZ0M7Q0FDdEIsQ0FBb0IsS0FBckIsQ0FBUCxDQUFBLEtBQTRCO0NBREU7O0FBR2hDLENBakJBLENBaUJxQyxDQUFyQyxHQUFNLENBQU8sRUFBd0IsRUFBQSxDQUFBLEVBQS9COztBQUVOLENBbkJBLENBbUIrQixDQUE1QixHQUFILEdBQVksS0FBRCxHQUFBO0NBRU4sQ0FBVSxDQURiLENBQUEs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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xNQTtBQUNBOzs7Ozs7Ozs7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7OztBQ3pWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyJDaG9yZERpYWdyYW0gPSByZXF1aXJlICcuL2Nob3JkX2RpYWdyYW0nXG5MYXlvdXQgPSByZXF1aXJlICcuL2xheW91dCdcbkluc3RydW1lbnRzID0gcmVxdWlyZSAnLi9pbnN0cnVtZW50cydcbntjaG9yZEZpbmdlcmluZ3N9ID0gcmVxdWlyZSAnLi9maW5nZXJpbmdzJ1xuXG57XG4gIENob3JkXG4gIENob3Jkc1xuICBTY2FsZVxuICBTY2FsZXNcbn0gPSByZXF1aXJlKCcuL3RoZW9yeScpXG5cblxuIyByZXF1aXJlanMgbmVjZXNzaXRhdGVzIHRoaXNcbmFuZ3VsYXIuZWxlbWVudChkb2N1bWVudCkucmVhZHkgLT5cbiAgYW5ndWxhci5ib290c3RyYXAoZG9jdW1lbnQsIFsnRnJldGJvYXJkQXBwJ10pXG5cbmFwcCA9IGFuZ3VsYXIubW9kdWxlICdGcmV0Ym9hcmRBcHAnLCBbJ25nQW5pbWF0ZScsICduZ1JvdXRlJywgJ25nU2FuaXRpemUnXVxuXG5hcHAuY29uZmlnICgkbG9jYXRpb25Qcm92aWRlciwgJHJvdXRlUHJvdmlkZXIpIC0+XG4gICRyb3V0ZVByb3ZpZGVyXG4gICAgLndoZW4oJy8nLCBjb250cm9sbGVyOiAnQ2hvcmRUYWJsZUN0cmwnLCB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9jaG9yZC10YWJsZS5odG1sJylcbiAgICAud2hlbignL2Nob3JkLzpjaG9yZE5hbWUnLCBjb250cm9sbGVyOiAnQ2hvcmREZXRhaWxzQ3RybCcsIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL2Nob3JkLWRldGFpbHMuaHRtbCcpXG4gICAgLm90aGVyd2lzZShyZWRpcmVjdFRvOiAnLycpXG5cbmFwcC5jb250cm9sbGVyICdDaG9yZFRhYmxlQ3RybCcsICgkc2NvcGUpIC0+XG4gICRzY29wZS50b25pY3MgPSBbJ0MnLCAnRCcsICdFJywgJ0YnLCAnRycsICdBJywgJ0InXVxuXG4gICRzY29wZS5nZXRTY2FsZUNob3JkcyA9IGRvIC0+XG4gICAgIyBUaGUgY2FjaGUgaXMgbmVjZXNzYXJ5IHRvIHByZXZlbnQgYSBkaWdlc3QgaXRlcmF0aW9uIGVycm9yXG4gICAgY2FjaGUgPSB7fVxuICAgIChzY2FsZU5hbWUsIHNldmVudGhzKSAtPlxuICAgICAgY2FjaGVbW3NjYWxlTmFtZSwgc2V2ZW50aHNdXSBvcj0gU2NhbGUuZmluZChzY2FsZU5hbWUpLmNob3JkcyhzZXZlbnRoczogc2V2ZW50aHMpXG5cbl8ubWl4aW4gcmV2ZXJzZTogKGFycmF5KSAtPiBbXS5jb25jYXQoYXJyYXkpLnJldmVyc2UoKVxuXG5hcHAuY29udHJvbGxlciAnQ2hvcmREZXRhaWxzQ3RybCcsICgkc2NvcGUsICRyb3V0ZVBhcmFtcykgLT5cbiAgY2hvcmROYW1lID0gJHJvdXRlUGFyYW1zLmNob3JkTmFtZVxuICBjaG9yZE5hbWUgPSBjaG9yZE5hbWUucmVwbGFjZSgnJiM5ODM5OycsICcjJylcbiAgY2hvcmQgPSBDaG9yZC5maW5kKGNob3JkTmFtZSlcbiAgaW5zdHJ1bWVudCA9IEluc3RydW1lbnRzLkRlZmF1bHRcblxuICAkc2NvcGUuaW5zdHJ1bWVudCA9IGluc3RydW1lbnRcbiAgJHNjb3BlLmNob3JkID0gY2hvcmRcbiAgJHNjb3BlLmZpbmdlcmluZ3MgPSBjaG9yZEZpbmdlcmluZ3MoY2hvcmQsIGluc3RydW1lbnQpXG5cbiAgJHNjb3BlLm9yZGVyQnkgPSAoa2V5KSAtPlxuICAgICRzY29wZS5zb3J0S2V5ID0ga2V5XG4gICAgZmluZ2VyaW5ncyA9ICRzY29wZS5maW5nZXJpbmdzXG4gICAgdmFsdWVzID0gXy5jb21wYWN0KGZpbmdlcmluZ3MubWFwIChmKSAtPiBmLnByb3BlcnRpZXNba2V5XSlcbiAgICBwcml2YXRpdmUgPSB2YWx1ZXNbMF0gPT0gdHJ1ZSBvciB2YWx1ZXNbMF0gPT0gZmFsc2VcbiAgICBmaW5nZXJpbmdzID0gXy5yZXZlcnNlKGZpbmdlcmluZ3MpIGlmIHByaXZhdGl2ZVxuICAgIGZpbmdlcmluZ3MgPSBfLnNvcnRCeShmaW5nZXJpbmdzLCAoZikgLT4gZi5wcm9wZXJ0aWVzW2tleV0gb3IgMClcbiAgICBmaW5nZXJpbmdzID0gXy5yZXZlcnNlKGZpbmdlcmluZ3MpIGlmIHByaXZhdGl2ZVxuICAgIGZvciBmaW5nZXJpbmcgaW4gZmluZ2VyaW5nc1xuICAgICAgbGFiZWxzID0gZmluZ2VyaW5nLmxhYmVscy5maWx0ZXIgKGxhYmVsKSAtPiBsYWJlbC5uYW1lID09IGtleVxuICAgICAgZmluZ2VyaW5nLmxhYmVscyA9IGxhYmVscy5jb25jYXQoXy5kaWZmZXJlbmNlKGZpbmdlcmluZy5sYWJlbHMsIGxhYmVscykpIGlmIGxhYmVscy5sZW5ndGhcbiAgICAkc2NvcGUuZmluZ2VyaW5ncyA9IGZpbmdlcmluZ3NcblxuICBmb3IgZmluZ2VyaW5nIGluICRzY29wZS5maW5nZXJpbmdzXG4gICAgbGFiZWxzID0gW11cbiAgICBmb3IgbmFtZSwgYmFkZ2Ugb2YgZmluZ2VyaW5nLnByb3BlcnRpZXNcbiAgICAgIGJhZGdlID0gbnVsbCBpZiBiYWRnZSA9PSB0cnVlXG4gICAgICBsYWJlbHMucHVzaCB7bmFtZSwgYmFkZ2V9XG4gICAgZmluZ2VyaW5nLmxhYmVscyA9IGxhYmVscy5zb3J0KClcblxuYXBwLmRpcmVjdGl2ZSAnY2hvcmQnLCAtPlxuICByZXN0cmljdDogJ0NFJ1xuICByZXBsYWNlOiB0cnVlXG4gIHRlbXBsYXRlOiAtPlxuICAgIGluc3RydW1lbnQgPSBJbnN0cnVtZW50cy5EZWZhdWx0XG4gICAgZGltZW5zaW9ucyA9IHt3aWR0aDogQ2hvcmREaWFncmFtLndpZHRoKGluc3RydW1lbnQpLCBoZWlnaHQ6IENob3JkRGlhZ3JhbS5oZWlnaHQoaW5zdHJ1bWVudCl9XG4gICAgXCI8ZGl2PjxzcGFuIGNsYXNzPSdmcmV0TnVtYmVyJyBuZzpzaG93PSd0b3BGcmV0Jz57e3RvcEZyZXR9fTwvc3Bhbj5cIiArXG4gICAgICBcIjxjYW52YXMgd2lkdGg9JyN7ZGltZW5zaW9ucy53aWR0aH0nIGhlaWdodD0nI3tkaW1lbnNpb25zLmhlaWdodH0nLz48L2Rpdj5cIlxuICBzY29wZToge2Nob3JkOiAnPScsIGZpbmdlcmluZzogJz0/J31cbiAgbGluazogKHNjb3BlLCBlbGVtZW50LCBhdHRycykgLT5cbiAgICBjYW52YXMgPSBlbGVtZW50WzBdLnF1ZXJ5U2VsZWN0b3IoJ2NhbnZhcycpXG4gICAgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJylcbiAgICBpbnN0cnVtZW50ID0gSW5zdHJ1bWVudHMuRGVmYXVsdFxuICAgIHJlbmRlciA9IC0+XG4gICAgICB7Y2hvcmQsIGZpbmdlcmluZ30gPSBzY29wZVxuICAgICAgZmluZ2VyaW5ncyA9IGNob3JkRmluZ2VyaW5ncyhjaG9yZCwgaW5zdHJ1bWVudClcbiAgICAgIGZpbmdlcmluZyBvcj0gZmluZ2VyaW5nc1swXVxuICAgICAgcmV0dXJuIHVubGVzcyBmaW5nZXJpbmdcbiAgICAgIGN0eC5jbGVhclJlY3QgMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0XG4gICAgICB7dG9wRnJldH0gPSBDaG9yZERpYWdyYW0uZHJhdyBjdHgsIGluc3RydW1lbnQsIGZpbmdlcmluZy5wb3NpdGlvbnMsIGJhcnJlczogZmluZ2VyaW5nLmJhcnJlc1xuICAgICAgc2NvcGUudG9wRnJldCA9IHRvcEZyZXQgaWYgdG9wRnJldCA+IDBcbiAgICByZW5kZXIoKVxuXG5hcHAuZmlsdGVyICdyYWlzZUFjY2lkZW50YWxzJywgLT5cbiAgKG5hbWUpIC0+XG4gICAgbmFtZS5yZXBsYWNlKC8oW+KZr+KZrV0pLywgJzxzdXA+JDE8L3N1cD4nKVxuIiwiXG4iLCJfID0gcmVxdWlyZSAndW5kZXJzY29yZSdcblxue1xuICBGcmV0Q291bnRcbiAgRnJldE51bWJlcnNcbn0gPSByZXF1aXJlICcuL2luc3RydW1lbnRzJ1xuTGF5b3V0ID0gcmVxdWlyZSAnLi9sYXlvdXQnXG5cbiNcbiMgU3R5bGVcbiNcblxue2hzdjJjc3N9ID0gcmVxdWlyZSAnLi91dGlscydcblxuU21hbGxTdHlsZSA9XG4gIGhfZ3V0dGVyOiA1XG4gIHZfZ3V0dGVyOiA1XG4gIHN0cmluZ19zcGFjaW5nOiA2XG4gIGZyZXRfaGVpZ2h0OiA4XG4gIGFib3ZlX2ZyZXRib2FyZDogOFxuICBub3RlX3JhZGl1czogMVxuICBjbG9zZWRfc3RyaW5nX2ZvbnRzaXplOiA0XG4gIGNob3JkX2RlZ3JlZV9jb2xvcnM6IFsncmVkJywgJ2JsdWUnLCAnZ3JlZW4nLCAnb3JhbmdlJ11cbiAgaW50ZXJ2YWxDbGFzc19jb2xvcnM6IFswLi4uMTJdLm1hcCAobikgLT5cbiAgICAjIGkgPSAoNyAqIG4pICUgMTIgICMgY29sb3IgYnkgY2lyY2xlIG9mIGZpZnRoIGFzY2Vuc2lvblxuICAgIGhzdjJjc3MgaDogbiAqIDM2MCAvIDEyLCBzOiAxLCB2OiAxXG5cbkRlZmF1bHRTdHlsZSA9IF8uZXh0ZW5kIHt9LCBTbWFsbFN0eWxlLFxuICBzdHJpbmdfc3BhY2luZzogMTJcbiAgZnJldF9oZWlnaHQ6IDE2XG4gIG5vdGVfcmFkaXVzOiAzXG4gIGNsb3NlZF9zdHJpbmdfZm9udHNpemU6IDhcblxuY29tcHV0ZUNob3JkRGlhZ3JhbURpbWVuc2lvbnMgPSAoaW5zdHJ1bWVudCwgc3R5bGU9RGVmYXVsdFN0eWxlKSAtPlxuICB7XG4gICAgd2lkdGg6IDIgKiBzdHlsZS5oX2d1dHRlciArIChpbnN0cnVtZW50LnN0cmluZ3MgLSAxKSAqIHN0eWxlLnN0cmluZ19zcGFjaW5nXG4gICAgaGVpZ2h0OiAyICogc3R5bGUudl9ndXR0ZXIgKyAoc3R5bGUuZnJldF9oZWlnaHQgKyAyKSAqIEZyZXRDb3VudFxuICB9XG5cblxuI1xuIyBEcmF3aW5nIE1ldGhvZHNcbiNcblxuZHJhd0Nob3JkRGlhZ3JhbVN0cmluZ3MgPSAoY3R4LCBpbnN0cnVtZW50LCBvcHRpb25zPXt9KSAtPlxuICBzdHlsZSA9IERlZmF1bHRTdHlsZVxuICBmb3Igc3RyaW5nIGluIGluc3RydW1lbnQuc3RyaW5nTnVtYmVyc1xuICAgIHggPSBzdHJpbmcgKiBzdHlsZS5zdHJpbmdfc3BhY2luZyArIHN0eWxlLmhfZ3V0dGVyXG4gICAgY3R4LmJlZ2luUGF0aCgpXG4gICAgY3R4Lm1vdmVUbyB4LCBzdHlsZS52X2d1dHRlciArIHN0eWxlLmFib3ZlX2ZyZXRib2FyZFxuICAgIGN0eC5saW5lVG8geCwgc3R5bGUudl9ndXR0ZXIgKyBzdHlsZS5hYm92ZV9mcmV0Ym9hcmQgKyBGcmV0Q291bnQgKiBzdHlsZS5mcmV0X2hlaWdodFxuICAgIGN0eC5zdHJva2VTdHlsZSA9IChpZiBvcHRpb25zLmRpbVN0cmluZ3MgYW5kIHN0cmluZyBpbiBvcHRpb25zLmRpbVN0cmluZ3MgdGhlbiAncmdiYSgwLDAsMCwwLjIpJyBlbHNlICdibGFjaycpXG4gICAgY3R4LnN0cm9rZSgpXG5cbmRyYXdDaG9yZERpYWdyYW1GcmV0cyA9IChjdHgsIGluc3RydW1lbnQsIHtkcmF3TnV0fT17ZHJhd051dDogdHJ1ZX0pIC0+XG4gIHN0eWxlID0gRGVmYXVsdFN0eWxlXG4gIGN0eC5zdHJva2VTdHlsZSA9ICdibGFjaydcbiAgZm9yIGZyZXQgaW4gRnJldE51bWJlcnNcbiAgICB5ID0gc3R5bGUudl9ndXR0ZXIgKyBzdHlsZS5hYm92ZV9mcmV0Ym9hcmQgKyBmcmV0ICogc3R5bGUuZnJldF9oZWlnaHRcbiAgICBjdHguYmVnaW5QYXRoKClcbiAgICBjdHgubW92ZVRvIHN0eWxlLnZfZ3V0dGVyIC0gMC41LCB5XG4gICAgY3R4LmxpbmVUbyBzdHlsZS52X2d1dHRlciArIDAuNSArIChpbnN0cnVtZW50LnN0cmluZ3MgLSAxKSAqIHN0eWxlLnN0cmluZ19zcGFjaW5nLCB5XG4gICAgY3R4LmxpbmVXaWR0aCA9IDMgaWYgZnJldCA9PSAwIGFuZCBkcmF3TnV0XG4gICAgY3R4LnN0cm9rZSgpXG4gICAgY3R4LmxpbmVXaWR0aCA9IDFcblxuZHJhd0Nob3JkRGlhZ3JhbSA9IChjdHgsIGluc3RydW1lbnQsIHBvc2l0aW9ucywgb3B0aW9ucz17fSkgLT5cbiAgZGVmYXVsdHMgPSB7ZHJhd0Nsb3NlZFN0cmluZ3M6IHRydWUsIGRyYXdOdXQ6IHRydWUsIGR5OiAwLCBzdHlsZTogRGVmYXVsdFN0eWxlfVxuICBvcHRpb25zID0gXy5leHRlbmQgZGVmYXVsdHMsIG9wdGlvbnNcbiAge2JhcnJlcywgZHksIGRyYXdDbG9zZWRTdHJpbmdzLCBkcmF3TnV0LCBzdHlsZX0gPSBvcHRpb25zXG5cbiAgdG9wRnJldCA9IDBcbiAgZnJldHMgPSAoZnJldCBmb3Ige2ZyZXR9IGluIHBvc2l0aW9ucyB3aGVuIGZyZXQgIT0gMClcbiAgbG93ZXN0RnJldCA9IE1hdGgubWluKGZyZXRzLi4uKVxuICBoaWdoZXN0RnJldCA9IE1hdGgubWF4KGZyZXRzLi4uKVxuICBpZiBoaWdoZXN0RnJldCA+IDRcbiAgICB0b3BGcmV0ID0gbG93ZXN0RnJldCAtIDFcbiAgICBkcmF3TnV0ID0gZmFsc2VcblxuICBpZiBvcHRpb25zLmRpbVVudXNlZFN0cmluZ3NcbiAgICB1c2VkU3RyaW5ncyA9IChzdHJpbmcgZm9yIHtzdHJpbmd9IGluIHBvc2l0aW9ucylcbiAgICBvcHRpb25zLmRpbVN0cmluZ3MgPSAoc3RyaW5nIGZvciBzdHJpbmcgaW4gaW5zdHJ1bWVudC5zdHJpbmdOdW1iZXJzIHdoZW4gc3RyaW5nIG5vdCBpbiB1c2VkU3RyaW5ncylcblxuICBmaW5nZXJDb29yZGluYXRlcyA9ICh7c3RyaW5nLCBmcmV0fSkgLT5cbiAgICBmcmV0IC09IHRvcEZyZXQgaWYgZnJldCA+IDBcbiAgICByZXR1cm4ge1xuICAgICAgeDogc3R5bGUuaF9ndXR0ZXIgKyBzdHJpbmcgKiBzdHlsZS5zdHJpbmdfc3BhY2luZyxcbiAgICAgIHk6IHN0eWxlLnZfZ3V0dGVyICsgc3R5bGUuYWJvdmVfZnJldGJvYXJkICsgKGZyZXQgLSAwLjUpICogc3R5bGUuZnJldF9oZWlnaHQgKyBkeVxuICAgIH1cblxuICBkcmF3RmluZ2VyUG9zaXRpb24gPSAocG9zaXRpb24sIG9wdGlvbnM9e30pIC0+XG4gICAge2lzUm9vdCwgY29sb3J9ID0gb3B0aW9uc1xuICAgIHt4LCB5fSA9IGZpbmdlckNvb3JkaW5hdGVzKHBvc2l0aW9uKVxuICAgIGN0eC5maWxsU3R5bGUgPSBjb2xvciBvciAoaWYgaXNSb290IHRoZW4gJ3JlZCcgZWxzZSAnd2hpdGUnKVxuICAgIGN0eC5zdHJva2VTdHlsZSA9IGNvbG9yIG9yIChpZiBpc1Jvb3QgdGhlbiAncmVkJyBlbHNlICdibGFjaycpXG4gICAgY3R4LmxpbmVXaWR0aCA9IDFcbiAgICBjdHguYmVnaW5QYXRoKClcbiAgICBpZiBpc1Jvb3QgYW5kIHBvc2l0aW9uLmZyZXRcbiAgICAgIGRvIChyPXN0eWxlLm5vdGVfcmFkaXVzKSAtPlxuICAgICAgICBjdHgucmVjdCB4IC0gciwgeSAtIHIsIDIgKiByLCAyICogclxuICAgIGVsc2VcbiAgICAgIGN0eC5hcmMgeCwgeSwgc3R5bGUubm90ZV9yYWRpdXMsIDAsIE1hdGguUEkgKiAyLCBmYWxzZVxuICAgIGN0eC5maWxsKCkgaWYgcG9zaXRpb24uZnJldCA+IDAgb3IgaXNSb290XG4gICAgY3R4LnN0cm9rZSgpXG5cbiAgZHJhd0JhcnJlcyA9IC0+XG4gICAgY3R4LmZpbGxTdHlsZSA9ICdibGFjaydcbiAgICBmb3Ige2ZyZXQsIGZpcnN0U3RyaW5nLCBzdHJpbmdDb3VudH0gaW4gYmFycmVzXG4gICAgICB7eDogeDEsIHl9ID0gZmluZ2VyQ29vcmRpbmF0ZXMge3N0cmluZzogZmlyc3RTdHJpbmcsIGZyZXR9XG4gICAgICB7eDogeDJ9ID0gZmluZ2VyQ29vcmRpbmF0ZXMge3N0cmluZzogZmlyc3RTdHJpbmcgKyBzdHJpbmdDb3VudCAtIDEsIGZyZXR9XG4gICAgICB3ID0geDIgLSB4MVxuICAgICAgY3R4LnNhdmUoKVxuICAgICAgY3R4LnRyYW5zbGF0ZSAoeDEgKyB4MikgLyAyLCB5IC0gc3R5bGUuZnJldF9oZWlnaHQgKiAuMjVcbiAgICAgIGN0eC5iZWdpblBhdGgoKVxuICAgICAgZWNjZW50cmljaXR5ID0gMTBcbiAgICAgIGRvIC0+XG4gICAgICAgIGN0eC5zYXZlKClcbiAgICAgICAgY3R4LnNjYWxlIHcsIGVjY2VudHJpY2l0eVxuICAgICAgICBjdHguYXJjIDAsIDAsIHN0eWxlLnN0cmluZ19zcGFjaW5nIC8gMiAvIGVjY2VudHJpY2l0eSwgTWF0aC5QSSwgMCwgZmFsc2VcbiAgICAgICAgY3R4LnJlc3RvcmUoKVxuICAgICAgZG8gLT5cbiAgICAgICAgY3R4LnNhdmUoKVxuICAgICAgICBjdHguc2NhbGUgdywgMTRcbiAgICAgICAgY3R4LmFyYyAwLCAwLCBzdHlsZS5zdHJpbmdfc3BhY2luZyAvIDIgLyBlY2NlbnRyaWNpdHksIDAsIE1hdGguUEksIHRydWVcbiAgICAgICAgY3R4LnJlc3RvcmUoKVxuICAgICAgY3R4LmZpbGwoKVxuICAgICAgY3R4LnJlc3RvcmUoKVxuICAgICAgIyBjdHguZmlsbFN0eWxlID0gJ3JnYmEoMCwwLDAsIDAuNSknXG4gICAgICAjIGN0eC5iZWdpblBhdGgoKVxuICAgICAgIyBjdHguYXJjIHgxLCB5LCBzdHlsZS5zdHJpbmdfc3BhY2luZyAvIDIsIE1hdGguUEkgKiAxLzIsIE1hdGguUEkgKiAzLzIsIGZhbHNlXG4gICAgICAjIGN0eC5hcmMgeDIsIHksIHN0eWxlLnN0cmluZ19zcGFjaW5nIC8gMiwgTWF0aC5QSSAqIDMvMiwgTWF0aC5QSSAqIDEvMiwgZmFsc2VcbiAgICAgICMgY3R4LmZpbGwoKVxuXG4gIGRyYXdGaW5nZXJQb3NpdGlvbnMgPSAtPlxuICAgIGZvciBwb3NpdGlvbiBpbiBwb3NpdGlvbnNcbiAgICAgIGRlZmF1bHRfb3B0aW9ucyA9XG4gICAgICAgIGNvbG9yOiBzdHlsZS5pbnRlcnZhbENsYXNzX2NvbG9yc1twb3NpdGlvbi5pbnRlcnZhbENsYXNzXVxuICAgICAgICBpc1Jvb3Q6IChwb3NpdGlvbi5pbnRlcnZhbENsYXNzID09IDApXG4gICAgICBkcmF3RmluZ2VyUG9zaXRpb24gcG9zaXRpb24sIF8uZXh0ZW5kKGRlZmF1bHRfb3B0aW9ucywgcG9zaXRpb24pXG5cbiAgZHJhd0Nsb3NlZFN0cmluZ3MgPSAtPlxuICAgIGZyZXR0ZWRfc3RyaW5ncyA9IFtdXG4gICAgZnJldHRlZF9zdHJpbmdzW3Bvc2l0aW9uLnN0cmluZ10gPSB0cnVlIGZvciBwb3NpdGlvbiBpbiBwb3NpdGlvbnNcbiAgICBjbG9zZWRfc3RyaW5ncyA9IChzdHJpbmcgZm9yIHN0cmluZyBpbiBpbnN0cnVtZW50LnN0cmluZ051bWJlcnMgd2hlbiBub3QgZnJldHRlZF9zdHJpbmdzW3N0cmluZ10pXG4gICAgciA9IHN0eWxlLm5vdGVfcmFkaXVzXG4gICAgY3R4LmZpbGxTdHlsZSA9ICdibGFjaydcbiAgICBmb3Igc3RyaW5nIGluIGNsb3NlZF9zdHJpbmdzXG4gICAgICB7eCwgeX0gPSBmaW5nZXJDb29yZGluYXRlcyB7c3RyaW5nLCBmcmV0OiAwfVxuICAgICAgY3R4LnN0cm9rZVN0eWxlID0gJ2JsYWNrJ1xuICAgICAgY3R4LmJlZ2luUGF0aCgpXG4gICAgICBjdHgubW92ZVRvIHggLSByLCB5IC0gclxuICAgICAgY3R4LmxpbmVUbyB4ICsgciwgeSArIHJcbiAgICAgIGN0eC5tb3ZlVG8geCAtIHIsIHkgKyByXG4gICAgICBjdHgubGluZVRvIHggKyByLCB5IC0gclxuICAgICAgY3R4LnN0cm9rZSgpXG5cbiAgZHJhd0Nob3JkRGlhZ3JhbVN0cmluZ3MgY3R4LCBpbnN0cnVtZW50LCBvcHRpb25zXG4gIGRyYXdDaG9yZERpYWdyYW1GcmV0cyBjdHgsIGluc3RydW1lbnQsIGRyYXdOdXQ6IGRyYXdOdXRcbiAgZHJhd0JhcnJlcygpIGlmIGJhcnJlc1xuICBkcmF3RmluZ2VyUG9zaXRpb25zKCkgaWYgcG9zaXRpb25zXG4gIGRyYXdDbG9zZWRTdHJpbmdzKCkgaWYgcG9zaXRpb25zIGFuZCBvcHRpb25zLmRyYXdDbG9zZWRTdHJpbmdzXG4gIHJldHVybiB7dG9wRnJldH1cblxuZHJhd0Nob3JkQmxvY2sgPSAoaW5zdHJ1bWVudCwgcG9zaXRpb25zLCBvcHRpb25zKSAtPlxuICBkaW1lbnNpb25zID0gY29tcHV0ZUNob3JkRGlhZ3JhbURpbWVuc2lvbnMoaW5zdHJ1bWVudClcbiAgTGF5b3V0LmJsb2NrXG4gICAgd2lkdGg6IGRpbWVuc2lvbnMud2lkdGhcbiAgICBoZWlnaHQ6IGRpbWVuc2lvbnMuaGVpZ2h0XG4gICAgZHJhdzogKCkgLT5cbiAgICAgIExheW91dC53aXRoR3JhcGhpY3NDb250ZXh0IChjdHgpIC0+XG4gICAgICAgIGN0eC50cmFuc2xhdGUgMCwgLWRpbWVuc2lvbnMuaGVpZ2h0XG4gICAgICAgIGRyYXdDaG9yZERpYWdyYW0gY3R4LCBpbnN0cnVtZW50LCBwb3NpdGlvbnMsIG9wdGlvbnNcblxubW9kdWxlLmV4cG9ydHMgPVxuICBkZWZhdWx0U3R5bGU6IERlZmF1bHRTdHlsZVxuICB3aWR0aDogKGluc3RydW1lbnQpIC0+IGNvbXB1dGVDaG9yZERpYWdyYW1EaW1lbnNpb25zKGluc3RydW1lbnQpLndpZHRoXG4gIGhlaWdodDogKGluc3RydW1lbnQpIC0+IGNvbXB1dGVDaG9yZERpYWdyYW1EaW1lbnNpb25zKGluc3RydW1lbnQpLmhlaWdodFxuICBkcmF3OiBkcmF3Q2hvcmREaWFncmFtXG4gIGJsb2NrOiBkcmF3Q2hvcmRCbG9ja1xuIiwidXRpbCA9IHJlcXVpcmUgJ3V0aWwnXG5fID0gcmVxdWlyZSAndW5kZXJzY29yZSdcbntnZXRQaXRjaENsYXNzTmFtZSwgaW50ZXJ2YWxDbGFzc0RpZmZlcmVuY2V9ID0gcmVxdWlyZSAnLi90aGVvcnknXG5JbnN0cnVtZW50cyA9IHJlcXVpcmUgJy4vaW5zdHJ1bWVudHMnXG5cbntcbiAgRnJldE51bWJlcnNcbiAgZnJldGJvYXJkUG9zaXRpb25zRWFjaFxuICBwaXRjaE51bWJlckZvclBvc2l0aW9uXG59ID0gSW5zdHJ1bWVudHNcblxucmVxdWlyZSAnLi91dGlscydcblxuIyBUaGVzZSBhcmUgXCJmaW5nZXJpbmdzXCIsIG5vdCBcInZvaWNpbmdzXCIsIGJlY2F1c2UgdGhleSBhbHNvIGluY2x1ZGUgYmFycmUgaW5mb3JtYXRpb24uXG5jbGFzcyBGaW5nZXJpbmdcbiAgY29uc3RydWN0b3I6ICh7QHBvc2l0aW9ucywgQGNob3JkLCBAYmFycmVzLCBAaW5zdHJ1bWVudH0pIC0+XG4gICAgQHBvc2l0aW9ucy5zb3J0IChhLCBiKSAtPiBhLnN0cmluZyAtIGIuc3RyaW5nXG4gICAgQHByb3BlcnRpZXMgPSB7fVxuXG4gIEBjYWNoZWRfZ2V0dGVyICdmcmV0c3RyaW5nJywgLT5cbiAgICBmcmV0QXJyYXkgPSAoLTEgZm9yIHMgaW4gQGluc3RydW1lbnQuc3RyaW5nTnVtYmVycylcbiAgICBmcmV0QXJyYXlbc3RyaW5nXSA9IGZyZXQgZm9yIHtzdHJpbmcsIGZyZXR9IGluIEBwb3NpdGlvbnNcbiAgICAoKGlmIHggPj0gMCB0aGVuIHggZWxzZSAneCcpIGZvciB4IGluIGZyZXRBcnJheSkuam9pbignJylcblxuICBAY2FjaGVkX2dldHRlciAnY2hvcmROYW1lJywgLT5cbiAgICBuYW1lID0gQGNob3JkLm5hbWVcbiAgICBuYW1lICs9IFwiIC8gI3tnZXRQaXRjaENsYXNzTmFtZShAaW5zdHJ1bWVudC5waXRjaEF0KEBwb3NpdGlvbnNbMF0pKX1cIiBpZiBAaW52ZXJzaW9uID4gMFxuICAgIHJldHVybiBuYW1lXG5cbiAgIyBAY2FjaGVkX2dldHRlciAncGl0Y2hlcycsIC0+XG4gICMgICAoQGluc3RydW1lbnQucGl0Y2hBdChwb3NpdGlvbnMpIGZvciBwb3NpdGlvbnMgaW4gQHBvc2l0aW9ucylcblxuICAjIEBjYWNoZWRfZ2V0dGVyICdpbnRlcnZhbHMnLCAtPlxuICAjICAgXy51bmlxKGludGVydmFsQ2xhc3NEaWZmZXJlbmNlKEBjaG9yZC5yb290UGl0Y2gsIHBpdGNoQ2xhc3MpIGZvciBwaXRjaENsYXNzIGluIEAucGl0Y2hlcylcblxuICBAY2FjaGVkX2dldHRlciAnaW52ZXJzaW9uJywgLT5cbiAgICBAY2hvcmQucGl0Y2hDbGFzc2VzLmluZGV4T2YgaW50ZXJ2YWxDbGFzc0RpZmZlcmVuY2UoQGNob3JkLnJvb3RQaXRjaCwgQGluc3RydW1lbnQucGl0Y2hBdChAcG9zaXRpb25zWzBdKSlcblxuICBAY2FjaGVkX2dldHRlciAnaW52ZXJzaW9uTGV0dGVyJywgLT5cbiAgICByZXR1cm4gdW5sZXNzIEBpbnZlcnNpb24gPiAwXG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoOTYgKyBAaW52ZXJzaW9uKVxuXG5cbiNcbiMgQmFycmVzXG4jXG5cbnBvd2Vyc2V0ID0gKGFycmF5KSAtPlxuICByZXR1cm4gW1tdXSB1bmxlc3MgYXJyYXkubGVuZ3RoXG4gIFt4LCB4cy4uLl0gPSBhcnJheVxuICB0YWlsID0gcG93ZXJzZXQoeHMpXG4gIHJldHVybiB0YWlsLmNvbmNhdChbeF0uY29uY2F0KHlzKSBmb3IgeXMgaW4gdGFpbClcblxuIyBSZXR1cm5zIGFuIGFycmF5IG9mIHN0cmluZ3MgaW5kZXhlZCBieSBmcmV0IG51bWJlci4gRWFjaCBzdHJpbmdcbiMgaGFzIGEgY2hhcmFjdGVyIGF0IGVhY2ggc3RyaW5nIHBvc2l0aW9uOlxuIyAnPScgPSBmcmV0dGVkIGF0IHRoaXMgZnJldFxuIyAnPicgPSBmcmV0dGVkIGF0IGEgaGlnaGVyIGZyZXRcbiMgJzwnID0gZnJldHRlZCBhdCBhIGxvd2VyIGZyZXQsIG9yIG9wZW5cbiMgJ3gnID0gbXV0ZWRcbmNvbXB1dGVCYXJyZUNhbmRpZGF0ZVN0cmluZ3MgPSAoaW5zdHJ1bWVudCwgZnJldEFycmF5KSAtPlxuICBjb2RlU3RyaW5ncyA9IFtdXG4gIGZvciByZWZlcmVuY2VGcmV0IGluIGZyZXRBcnJheVxuICAgIGNvbnRpbnVlIHVubGVzcyB0eXBlb2YocmVmZXJlbmNlRnJldCkgPT0gJ251bWJlcidcbiAgICBjb2RlU3RyaW5nc1tyZWZlcmVuY2VGcmV0XSBvcj0gKGZvciBmcmV0IGluIGZyZXRBcnJheVxuICAgICAgaWYgZnJldCA8IHJlZmVyZW5jZUZyZXRcbiAgICAgICAgJzwnXG4gICAgICBlbHNlIGlmIGZyZXQgPiByZWZlcmVuY2VGcmV0XG4gICAgICAgICc+J1xuICAgICAgZWxzZSBpZiBmcmV0ID09IHJlZmVyZW5jZUZyZXRcbiAgICAgICAgJz0nXG4gICAgICBlbHNlXG4gICAgICAgICd4Jykuam9pbignJylcbiAgcmV0dXJuIGNvZGVTdHJpbmdzXG5cbmZpbmRCYXJyZXMgPSAoaW5zdHJ1bWVudCwgZnJldEFycmF5KSAtPlxuICBiYXJyZXMgPSBbXVxuICBmb3IgY29kZVN0cmluZywgZnJldCBpbiBjb21wdXRlQmFycmVDYW5kaWRhdGVTdHJpbmdzKGluc3RydW1lbnQsIGZyZXRBcnJheSlcbiAgICBjb250aW51ZSBpZiBmcmV0ID09IDBcbiAgICBjb250aW51ZSB1bmxlc3MgY29kZVN0cmluZ1xuICAgIG1hdGNoID0gY29kZVN0cmluZy5tYXRjaCgvKD1bPj1dKykvKVxuICAgIGNvbnRpbnVlIHVubGVzcyBtYXRjaFxuICAgIHJ1biA9IG1hdGNoWzFdXG4gICAgY29udGludWUgdW5sZXNzIHJ1bi5tYXRjaCgvXFw9L2cpLmxlbmd0aCA+IDFcbiAgICBiYXJyZXMucHVzaFxuICAgICAgZnJldDogZnJldFxuICAgICAgZmlyc3RTdHJpbmc6IG1hdGNoLmluZGV4XG4gICAgICBzdHJpbmdDb3VudDogcnVuLmxlbmd0aFxuICAgICAgZmluZ2VyUmVwbGFjZW1lbnRDb3VudDogcnVuLm1hdGNoKC9cXD0vZykubGVuZ3RoXG4gIHJldHVybiBiYXJyZXNcblxuY29sbGVjdEJhcnJlU2V0cyA9IChpbnN0cnVtZW50LCBmcmV0QXJyYXkpIC0+XG4gIGJhcnJlcyA9IGZpbmRCYXJyZXMoaW5zdHJ1bWVudCwgZnJldEFycmF5KVxuICByZXR1cm4gcG93ZXJzZXQoYmFycmVzKVxuXG5cbiNcbiMgRmluZ2VyaW5nc1xuI1xuXG5maW5nZXJQb3NpdGlvbnNPbkNob3JkID0gKGNob3JkLCBpbnN0cnVtZW50KSAtPlxuICB7cm9vdFBpdGNoLCBwaXRjaENsYXNzZXN9ID0gY2hvcmRcbiAgcG9zaXRpb25zID0gW11cbiAgaW5zdHJ1bWVudC5lYWNoRmluZ2VyUG9zaXRpb24gKHBvcykgLT5cbiAgICBpbnRlcnZhbENsYXNzID0gaW50ZXJ2YWxDbGFzc0RpZmZlcmVuY2Ugcm9vdFBpdGNoLCBpbnN0cnVtZW50LnBpdGNoQXQocG9zKVxuICAgIGRlZ3JlZUluZGV4ID0gcGl0Y2hDbGFzc2VzLmluZGV4T2YgaW50ZXJ2YWxDbGFzc1xuICAgIHBvc2l0aW9ucy5wdXNoIHBvcyBpZiBkZWdyZWVJbmRleCA+PSAwXG4gIHBvc2l0aW9uc1xuXG4jIFRPRE8gYWRkIG9wdGlvbnMgZm9yIHN0cnVtbWluZyB2cy4gZmluZ2Vyc3R5bGU7IG11dGluZzsgc3RyZXRjaFxuY2hvcmRGaW5nZXJpbmdzID0gKGNob3JkLCBpbnN0cnVtZW50LCBvcHRpb25zPXt9KSAtPlxuICBvcHRpb25zID0gXy5leHRlbmQge2ZpbHRlcjogdHJ1ZX0sIG9wdGlvbnNcbiAgd2FybiA9IGZhbHNlXG4gIHRocm93IG5ldyBFcnJvciBcIk5vIHJvb3QgZm9yICN7dXRpbC5pbnNwZWN0IGNob3JkfVwiIHVubGVzcyBjaG9yZC5yb290UGl0Y2g/XG5cblxuICAjXG4gICMgR2VuZXJhdGVcbiAgI1xuXG4gIGZyZXRzUGVyU3RyaW5nID0gIC0+XG4gICAgcG9zaXRpb25zID0gZmluZ2VyUG9zaXRpb25zT25DaG9yZChjaG9yZCwgaW5zdHJ1bWVudClcbiAgICBzdHJpbmdzID0gKFtudWxsXSBmb3IgcyBpbiBbMC4uLmluc3RydW1lbnQuc3RyaW5nQ291bnRdKVxuICAgIHN0cmluZ3Nbc3RyaW5nXS5wdXNoIGZyZXQgZm9yIHtzdHJpbmcsIGZyZXR9IGluIHBvc2l0aW9ucyB3aGVuIGZyZXQgPD0gNFxuICAgIHN0cmluZ3NcblxuICBjb2xsZWN0RmluZ2VyaW5nUG9zaXRpb25zID0gKGZyZXRDYW5kaWRhdGVzUGVyU3RyaW5nKSAtPlxuICAgIHN0cmluZ0NvdW50ID0gZnJldENhbmRpZGF0ZXNQZXJTdHJpbmcubGVuZ3RoXG4gICAgcG9zaXRpb25TZXQgPSBbXVxuICAgIGZyZXRBcnJheSA9IFtdXG4gICAgZmlsbCA9IChzKSAtPlxuICAgICAgaWYgcyA9PSBzdHJpbmdDb3VudFxuICAgICAgICBwb3NpdGlvblNldC5wdXNoIGZyZXRBcnJheS5zbGljZSgpXG4gICAgICBlbHNlXG4gICAgICAgIGZvciBmcmV0IGluIGZyZXRDYW5kaWRhdGVzUGVyU3RyaW5nW3NdXG4gICAgICAgICAgZnJldEFycmF5W3NdID0gZnJldFxuICAgICAgICAgIGZpbGwgcyArIDFcbiAgICBmaWxsIDBcbiAgICByZXR1cm4gcG9zaXRpb25TZXRcblxuICBjb250YWluc0FsbENob3JkUGl0Y2hlcyA9IChmcmV0QXJyYXkpIC0+XG4gICAgcGl0Y2hlcyA9IFtdXG4gICAgZm9yIGZyZXQsIHN0cmluZyBpbiBmcmV0QXJyYXlcbiAgICAgIGNvbnRpbnVlIHVubGVzcyB0eXBlb2YoZnJldCkgaXMgJ251bWJlcidcbiAgICAgIHBpdGNoQ2xhc3MgPSAoaW5zdHJ1bWVudC5waXRjaEF0IHtmcmV0LCBzdHJpbmd9KSAlIDEyXG4gICAgICBwaXRjaGVzLnB1c2ggcGl0Y2hDbGFzcyB1bmxlc3MgcGl0Y2hlcy5pbmRleE9mKHBpdGNoQ2xhc3MpID49IDBcbiAgICByZXR1cm4gcGl0Y2hlcy5sZW5ndGggPT0gY2hvcmQucGl0Y2hDbGFzc2VzLmxlbmd0aFxuXG4gIG1heGltdW1GcmV0RGlzdGFuY2UgPSAoZnJldEFycmF5KSAtPlxuICAgIGZyZXRzID0gKGZyZXQgZm9yIGZyZXQgaW4gZnJldEFycmF5IHdoZW4gdHlwZW9mKGZyZXQpIGlzICdudW1iZXInKVxuICAgICMgZnJldEFycmF5ID0gKGZyZXQgZm9yIGZyZXQgaW4gZnJldEFycmF5IHdoZW4gZnJldCA+IDApXG4gICAgcmV0dXJuIE1hdGgubWF4KGZyZXRzLi4uKSAtIE1hdGgubWluKGZyZXRzLi4uKSA8PSAzXG5cbiAgZ2VuZXJhdGVGaW5nZXJpbmdzID0gLT5cbiAgICBmaW5nZXJpbmdzID0gW11cbiAgICBmcmV0QXJyYXlzID0gY29sbGVjdEZpbmdlcmluZ1Bvc2l0aW9ucyhmcmV0c1BlclN0cmluZygpKVxuICAgIGZyZXRBcnJheXMgPSBmcmV0QXJyYXlzLmZpbHRlcihjb250YWluc0FsbENob3JkUGl0Y2hlcylcbiAgICBmcmV0QXJyYXlzID0gZnJldEFycmF5cy5maWx0ZXIobWF4aW11bUZyZXREaXN0YW5jZSlcbiAgICBmb3IgZnJldEFycmF5IGluIGZyZXRBcnJheXNcbiAgICAgIHBvc2l0aW9ucyA9ICh7ZnJldCwgc3RyaW5nfSBmb3IgZnJldCwgc3RyaW5nIGluIGZyZXRBcnJheSB3aGVuIHR5cGVvZihmcmV0KSBpcyAnbnVtYmVyJylcbiAgICAgIGZvciBwb3MgaW4gcG9zaXRpb25zXG4gICAgICAgIHBvcy5pbnRlcnZhbENsYXNzID0gaW50ZXJ2YWxDbGFzc0RpZmZlcmVuY2UgY2hvcmQucm9vdFBpdGNoLCBpbnN0cnVtZW50LnBpdGNoQXQocG9zKVxuICAgICAgICBwb3MuZGVncmVlSW5kZXggPSBjaG9yZC5waXRjaENsYXNzZXMuaW5kZXhPZiBwb3MuaW50ZXJ2YWxDbGFzc1xuICAgICAgc2V0cyA9IFtbXV1cbiAgICAgIHNldHMgPSBjb2xsZWN0QmFycmVTZXRzKGluc3RydW1lbnQsIGZyZXRBcnJheSkgaWYgcG9zaXRpb25zLmxlbmd0aCA+IDRcbiAgICAgIGZvciBiYXJyZXMgaW4gc2V0c1xuICAgICAgICBmaW5nZXJpbmdzLnB1c2ggbmV3IEZpbmdlcmluZyB7cG9zaXRpb25zLCBjaG9yZCwgYmFycmVzLCBpbnN0cnVtZW50fVxuICAgIGZpbmdlcmluZ3NcblxuICBjaG9yZE5vdGVDb3VudCA9IGNob3JkLnBpdGNoQ2xhc3Nlcy5sZW5ndGhcblxuXG4gICNcbiAgIyBGaWx0ZXJzXG4gICNcblxuICBjb3VudERpc3RpbmN0Tm90ZXMgPSAoZmluZ2VyaW5nKSAtPlxuICAgICMgXy5jaGFpbihmaW5nZXJpbmcucG9zaXRpb25zKS5wbHVjaygnaW50ZXJ2YWxDbGFzcycpLnVuaXEoKS52YWx1ZSgpLmxlbmd0aFxuICAgIHBpdGNoZXMgPSBbXVxuICAgIGZvciB7aW50ZXJ2YWxDbGFzc30gaW4gZmluZ2VyaW5nLnBvc2l0aW9uc1xuICAgICAgcGl0Y2hlcy5wdXNoIGludGVydmFsQ2xhc3MgdW5sZXNzIGludGVydmFsQ2xhc3MgaW4gcGl0Y2hlc1xuICAgIHJldHVybiBwaXRjaGVzLmxlbmd0aFxuXG4gIGhhc0FsbE5vdGVzID0gKGZpbmdlcmluZykgLT5cbiAgICByZXR1cm4gY291bnREaXN0aW5jdE5vdGVzKGZpbmdlcmluZykgPT0gY2hvcmROb3RlQ291bnRcblxuICBtdXRlZE1lZGlhbFN0cmluZ3MgPSAoZmluZ2VyaW5nKSAtPlxuICAgIHJldHVybiBmaW5nZXJpbmcuZnJldHN0cmluZy5tYXRjaCgvXFxkeCtcXGQvKVxuXG4gIG11dGVkVHJlYmxlU3RyaW5ncyA9IChmaW5nZXJpbmcpIC0+XG4gICAgcmV0dXJuIGZpbmdlcmluZy5mcmV0c3RyaW5nLm1hdGNoKC94JC8pXG5cbiAgZ2V0RmluZ2VyQ291bnQgPSAoZmluZ2VyaW5nKSAtPlxuICAgIG4gPSAocG9zIGZvciBwb3MgaW4gZmluZ2VyaW5nLnBvc2l0aW9ucyB3aGVuIHBvcy5mcmV0ID4gMCkubGVuZ3RoXG4gICAgbiAtPSBiYXJyZS5maW5nZXJSZXBsYWNlbWVudENvdW50IC0gMSBmb3IgYmFycmUgaW4gZmluZ2VyaW5nLmJhcnJlc1xuICAgIG5cblxuICBmb3VyRmluZ2Vyc09yRmV3ZXIgPSAoZmluZ2VyaW5nKSAtPlxuICAgIHJldHVybiBnZXRGaW5nZXJDb3VudChmaW5nZXJpbmcpIDw9IDRcblxuXG4gICMgQ29uc3RydWN0IHRoZSBmaWx0ZXIgc2V0XG5cbiAgZmlsdGVycyA9IFtdXG4gICMgZmlsdGVycy5wdXNoIG5hbWU6ICdoYXMgYWxsIGNob3JkIG5vdGVzJywgc2VsZWN0OiBoYXNBbGxOb3Rlc1xuXG4gIGlmIG9wdGlvbnMuZmlsdGVyXG4gICAgZmlsdGVycy5wdXNoIG5hbWU6ICdmb3VyIGZpbmdlcnMgb3IgZmV3ZXInLCBzZWxlY3Q6IGZvdXJGaW5nZXJzT3JGZXdlclxuXG4gIHVubGVzcyBvcHRpb25zLmZpbmdlcnBpY2tpbmdcbiAgICBmaWx0ZXJzLnB1c2ggbmFtZTogJ25vIG11dGVkIG1lZGlhbCBzdHJpbmdzJywgcmVqZWN0OiBtdXRlZE1lZGlhbFN0cmluZ3NcbiAgICBmaWx0ZXJzLnB1c2ggbmFtZTogJ25vIG11dGVkIHRyZWJsZSBzdHJpbmdzJywgcmVqZWN0OiBtdXRlZFRyZWJsZVN0cmluZ3NcblxuICAjIGZpbHRlciBieSBhbGwgdGhlIGZpbHRlcnMgaW4gdGhlIGxpc3QsIGV4Y2VwdCBpZ25vcmUgdGhvc2UgdGhhdCB3b3VsZG4ndCBwYXNzIGFueXRoaW5nXG4gIGZpbHRlckZpbmdlcmluZ3MgPSAoZmluZ2VyaW5ncykgLT5cbiAgICBmb3Ige25hbWUsIHNlbGVjdCwgcmVqZWN0fSBpbiBmaWx0ZXJzXG4gICAgICBmaWx0ZXJlZCA9IGZpbmdlcmluZ3NcbiAgICAgIHNlbGVjdCA9ICgoeCkgLT4gbm90IHJlamVjdCh4KSkgaWYgcmVqZWN0XG4gICAgICBmaWx0ZXJlZCA9IGZpbHRlcmVkLmZpbHRlcihzZWxlY3QpIGlmIHNlbGVjdFxuICAgICAgdW5sZXNzIGZpbHRlcmVkLmxlbmd0aFxuICAgICAgICBjb25zb2xlLndhcm4gXCIje2Nob3JkX25hbWV9OiBubyBmaW5nZXJpbmdzIHBhc3MgZmlsdGVyIFxcXCIje25hbWV9XFxcIlwiIGlmIHdhcm5cbiAgICAgICAgZmlsdGVyZWQgPSBmaW5nZXJpbmdzXG4gICAgICBmaW5nZXJpbmdzID0gZmlsdGVyZWRcbiAgICByZXR1cm4gZmluZ2VyaW5nc1xuXG5cbiAgI1xuICAjIFNvcnRcbiAgI1xuXG4gICMgRklYTUUgY291bnQgcGl0Y2ggY2xhc3Nlcywgbm90IHNvdW5kZWQgc3RyaW5nc1xuICBoaWdoTm90ZUNvdW50ID0gKGZpbmdlcmluZykgLT5cbiAgICBmaW5nZXJpbmcucG9zaXRpb25zLmxlbmd0aFxuXG4gIGlzUm9vdFBvc2l0aW9uID0gKGZpbmdlcmluZykgLT5cbiAgICBfKGZpbmdlcmluZy5wb3NpdGlvbnMpLnNvcnRCeSgocG9zKSAtPiBwb3Muc3RyaW5nKVswXS5kZWdyZWVJbmRleCA9PSAwXG5cbiAgcmV2ZXJzZVNvcnRLZXkgPSAoZm4pIC0+IChhKSAtPiAtZm4oYSlcblxuICAjIG9yZGVyZWQgbGlzdCBvZiBwcmVmZXJlbmNlcywgZnJvbSBtb3N0IHRvIGxlYXN0IGltcG9ydGFudFxuICBwcmVmZXJlbmNlcyA9IFtcbiAgICB7bmFtZTogJ3Jvb3QgcG9zaXRpb24nLCBrZXk6IGlzUm9vdFBvc2l0aW9ufVxuICAgIHtuYW1lOiAnaGlnaCBub3RlIGNvdW50Jywga2V5OiBoaWdoTm90ZUNvdW50fVxuICAgIHtuYW1lOiAnYXZvaWQgYmFycmVzJywga2V5OiByZXZlcnNlU29ydEtleSgoZmluZ2VyaW5nKSAtPiBmaW5nZXJpbmcuYmFycmVzLmxlbmd0aCl9XG4gICAge25hbWU6ICdsb3cgZmluZ2VyIGNvdW50Jywga2V5OiByZXZlcnNlU29ydEtleShnZXRGaW5nZXJDb3VudCl9XG4gIF1cblxuICBzb3J0RmluZ2VyaW5ncyA9IChmaW5nZXJpbmdzKSAtPlxuICAgIGZpbmdlcmluZ3MgPSBfKGZpbmdlcmluZ3MpLnNvcnRCeShrZXkpIGZvciB7a2V5fSBpbiBwcmVmZXJlbmNlcy5zbGljZSgwKS5yZXZlcnNlKClcbiAgICBmaW5nZXJpbmdzLnJldmVyc2UoKVxuICAgIHJldHVybiBmaW5nZXJpbmdzXG5cblxuICAjXG4gICMgR2VuZXJhdGUsIGZpbHRlciwgYW5kIHNvcnRcbiAgI1xuXG4gIGZpbmdlcmluZ3MgPSBnZW5lcmF0ZUZpbmdlcmluZ3MoKVxuICBmaW5nZXJpbmdzID0gZmlsdGVyRmluZ2VyaW5ncyhmaW5nZXJpbmdzKVxuICBmaW5nZXJpbmdzID0gc29ydEZpbmdlcmluZ3MoZmluZ2VyaW5ncylcblxuICBwcm9wZXJ0aWVzID0ge1xuICAgIHJvb3Q6IGlzUm9vdFBvc2l0aW9uXG4gICAgYmFycmVzOiAoZikgLT4gZi5iYXJyZXMubGVuZ3RoXG4gICAgZmluZ2VyczogZ2V0RmluZ2VyQ291bnRcbiAgICBpbnZlcnNpb246IChmKSAtPiBmLmludmVyc2lvbkxldHRlclxuICAgIHNraXBwaW5nOiAvXFxkeFxcZC9cbiAgICBtdXRpbmc6IC9cXGR4L1xuICAgIG9wZW46IC8wL1xuICAgIHRyaWFkOiAoe3Bvc2l0aW9uc30pIC0+IHBvc2l0aW9ucy5sZW5ndGggPT0gM1xuICAgIHBvc2l0aW9uOiAoe3Bvc2l0aW9uc30pIC0+IF8ubWluKF8ucGx1Y2socG9zaXRpb25zLCAnZnJldCcpKVxuICAgIHN0cmluZ3M6ICh7cG9zaXRpb25zfSkgLT4gcG9zaXRpb25zLmxlbmd0aFxuICB9XG4gIGZvciBuYW1lLCBmbiBvZiBwcm9wZXJ0aWVzXG4gICAgZm9yIGZpbmdlcmluZyBpbiBmaW5nZXJpbmdzXG4gICAgICB2YWx1ZSA9IGlmIGZuIGluc3RhbmNlb2YgUmVnRXhwIHRoZW4gZm4udGVzdChmaW5nZXJpbmcuZnJldHN0cmluZykgZWxzZSBmbihmaW5nZXJpbmcpXG4gICAgICBmaW5nZXJpbmcucHJvcGVydGllc1tuYW1lXSA9IHZhbHVlIGlmIHZhbHVlXG5cblxuICByZXR1cm4gZmluZ2VyaW5nc1xuXG5iZXN0RmluZ2VyaW5nRm9yID0gKGNob3JkLCBpbnN0cnVtZW50KSAtPlxuICByZXR1cm4gY2hvcmRGaW5nZXJpbmdzKGNob3JkLCBpbnN0cnVtZW50KVswXVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYmVzdEZpbmdlcmluZ0ZvclxuICBjaG9yZEZpbmdlcmluZ3Ncbn1cbiIsIntcbiAgRnJldENvdW50XG4gIEZyZXROdW1iZXJzXG59ID0gcmVxdWlyZSAnLi9pbnN0cnVtZW50cydcblxuXG4jXG4jIFN0eWxlXG4jXG5cbkRlZmF1bHRTdHlsZSA9XG4gIGhfZ3V0dGVyOiAxMFxuICB2X2d1dHRlcjogMTBcbiAgc3RyaW5nX3NwYWNpbmc6IDIwXG4gIGZyZXRfd2lkdGg6IDQ1XG4gIGZyZXRfb3Zlcmhhbmc6IC4zICogNDVcblxucGFkZGVkRnJldGJvYXJkV2lkdGggPSAoaW5zdHJ1bWVudCwgc3R5bGU9RGVmYXVsdFN0eWxlKSAtPlxuICAyICogc3R5bGUudl9ndXR0ZXIgKyBzdHlsZS5mcmV0X3dpZHRoICogRnJldENvdW50ICsgc3R5bGUuZnJldF9vdmVyaGFuZ1xuXG5wYWRkZWRGcmV0Ym9hcmRIZWlnaHQgPSAoaW5zdHJ1bWVudCwgc3R5bGU9RGVmYXVsdFN0eWxlKSAtPlxuICAyICogc3R5bGUuaF9ndXR0ZXIgKyAoaW5zdHJ1bWVudC5zdHJpbmdzIC0gMSkgKiBzdHlsZS5zdHJpbmdfc3BhY2luZ1xuXG5cbiNcbiMgRHJhd2luZyBNZXRob2RzXG4jXG5cbmRyYXdGcmV0Ym9hcmRTdHJpbmdzID0gKGluc3RydW1lbnQsIGN0eCkgLT5cbiAgc3R5bGUgPSBEZWZhdWx0U3R5bGVcbiAgZm9yIHN0cmluZyBpbiBpbnN0cnVtZW50LnN0cmluZ051bWJlcnNcbiAgICB5ID0gc3RyaW5nICogc3R5bGUuc3RyaW5nX3NwYWNpbmcgKyBzdHlsZS5oX2d1dHRlclxuICAgIGN0eC5iZWdpblBhdGgoKVxuICAgIGN0eC5tb3ZlVG8gc3R5bGUuaF9ndXR0ZXIsIHlcbiAgICBjdHgubGluZVRvIHN0eWxlLmhfZ3V0dGVyICsgRnJldENvdW50ICogc3R5bGUuZnJldF93aWR0aCArIHN0eWxlLmZyZXRfb3ZlcmhhbmcsIHlcbiAgICBjdHgubGluZVdpZHRoID0gMVxuICAgIGN0eC5zdHJva2UoKVxuXG5kcmF3RnJldGJvYXJkRnJldHMgPSAoY3R4LCBpbnN0cnVtZW50KSAtPlxuICBzdHlsZSA9IERlZmF1bHRTdHlsZVxuICBmb3IgZnJldCBpbiBGcmV0TnVtYmVyc1xuICAgIHggPSBzdHlsZS5oX2d1dHRlciArIGZyZXQgKiBzdHlsZS5mcmV0X3dpZHRoXG4gICAgY3R4LmJlZ2luUGF0aCgpXG4gICAgY3R4Lm1vdmVUbyB4LCBzdHlsZS5oX2d1dHRlclxuICAgIGN0eC5saW5lVG8geCwgc3R5bGUuaF9ndXR0ZXIgKyAoaW5zdHJ1bWVudC5zdHJpbmdzIC0gMSkgKiBzdHlsZS5zdHJpbmdfc3BhY2luZ1xuICAgIGN0eC5saW5lV2lkdGggPSAzIGlmIGZyZXQgPT0gMFxuICAgIGN0eC5zdHJva2UoKVxuICAgIGN0eC5saW5lV2lkdGggPSAxXG5cbmRyYXdGcmV0Ym9hcmRGaW5nZXJQb3NpdGlvbiA9IChjdHgsIGluc3RydW1lbnQsIHBvc2l0aW9uLCBvcHRpb25zPXt9KSAtPlxuICB7c3RyaW5nLCBmcmV0fSA9IHBvc2l0aW9uXG4gIHtpc1Jvb3QsIGNvbG9yfSA9IG9wdGlvbnNcbiAgc3R5bGUgPSBEZWZhdWx0U3R5bGVcbiAgY29sb3IgfHw9IGlmIGlzUm9vdCB0aGVuICdyZWQnIGVsc2UgJ3doaXRlJ1xuICB4ID0gc3R5bGUuaF9ndXR0ZXIgKyAoZnJldCAtIDAuNSkgKiBzdHlsZS5mcmV0X3dpZHRoXG4gIHggPSBzdHlsZS5oX2d1dHRlciBpZiBmcmV0ID09IDBcbiAgeSA9IHN0eWxlLnZfZ3V0dGVyICsgKDUgLSBzdHJpbmcpICogc3R5bGUuc3RyaW5nX3NwYWNpbmdcbiAgY3R4LmJlZ2luUGF0aCgpXG4gIGN0eC5hcmMgeCwgeSwgNywgMCwgMiAqIE1hdGguUEksIGZhbHNlXG4gIGN0eC5maWxsU3R5bGUgPSBjb2xvclxuICBjdHgubGluZVdpZHRoID0gMiB1bmxlc3MgaXNSb290XG4gIGN0eC5maWxsKClcbiAgY3R4LnN0cm9rZSgpXG4gIGN0eC5zdHJva2VTdHlsZSA9ICdibGFjaydcbiAgY3R4LmxpbmVXaWR0aCA9IDFcblxuZHJhd0ZyZXRib2FyZCA9IChjdHgsIGluc3RydW1lbnQsIHBvc2l0aW9ucykgLT5cbiAgZHJhd0ZyZXRib2FyZFN0cmluZ3MgY3R4LCBpbnN0cnVtZW50XG4gIGRyYXdGcmV0Ym9hcmRGcmV0cyBjdHgsIGluc3RydW1lbnRcbiAgZHJhd0ZyZXRib2FyZEZpbmdlclBvc2l0aW9uIGN0eCwgaW5zdHJ1bWVudCwgcG9zaXRpb24sIHBvc2l0aW9uIGZvciBwb3NpdGlvbiBpbiAocG9zaXRpb25zIG9yIFtdKVxuXG5tb2R1bGUuZXhwb3J0cyA9XG4gIGRyYXc6IGRyYXdGcmV0Ym9hcmRcbiAgaGVpZ2h0OiBwYWRkZWRGcmV0Ym9hcmRIZWlnaHRcbiAgd2lkdGg6IHBhZGRlZEZyZXRib2FyZFdpZHRoXG4iLCJfID0gcmVxdWlyZSAndW5kZXJzY29yZSdcbntJbnRlcnZhbE5hbWVzfSA9IHJlcXVpcmUgJy4vdGhlb3J5J1xue2Jsb2NrLCBkcmF3VGV4dCwgd2l0aEdyYXBoaWNzQ29udGV4dCwgd2l0aEFsaWdubWVudH0gPSByZXF1aXJlICcuL2xheW91dCdcbkNob3JkRGlhZ3JhbSA9IHJlcXVpcmUgJy4vY2hvcmRfZGlhZ3JhbSdcblxuRGVmYXVsdFN0eWxlID1cbiAgaW50ZXJ2YWxDbGFzc19jb2xvcnM6IENob3JkRGlhZ3JhbS5kZWZhdWx0U3R5bGUuaW50ZXJ2YWxDbGFzc19jb2xvcnNcbiAgcmFkaXVzOiA1MFxuICBjZW50ZXI6IHRydWVcbiAgZmlsbF9jZWxsczogZmFsc2VcbiAgbGFiZWxfY2VsbHM6IGZhbHNlXG5cbiMgRW51bWVyYXRlIHRoZXNlIGV4cGxpY2l0bHkgaW5zdGVhZCBvZiBjb21wdXRpbmcgdGhlbSxcbiMgc28gdGhhdCB3ZSBjYW4gZmluZS10dW5lIHRoZSBwb3NpdGlvbiBvZiBjZWxscyB0aGF0XG4jIGNvdWxkIGJlIHBsYWNlZCBhdCBvbmUgb2Ygc2V2ZXJhbCBkaWZmZXJlbnQgbG9jYXRpb25zLlxuSW50ZXJ2YWxWZWN0b3JzID1cbiAgMjoge1A1OiAtMSwgbTM6IC0xfVxuICAzOiB7bTM6IDF9XG4gIDQ6IHtNMzogMX1cbiAgNToge1A1OiAtMX1cbiAgNjoge20zOiAyfVxuICAxMToge1A1OiAxLCBNMzogMX1cblxuIyBSZXR1cm5zIGEgcmVjb3JkIHttMyBNMyBQNX0gdGhhdCByZXByZXNlbnRzIHRoZSBjYW5vbmljYWwgdmVjdG9yIChhY2NvcmRpbmcgdG8gYEludGVydmFsVmVjdG9yc2ApXG4jIG9mIHRoZSBpbnRlcnZhbCBjbGFzcy5cbmludGVydmFsQ2xhc3NWZWN0b3JzID0gKGludGVydmFsQ2xhc3MpIC0+XG4gIG9yaWdpbmFsX2ludGVydmFsQ2xhc3MgPSBpbnRlcnZhbENsYXNzICMgZm9yIGVycm9yIHJlcG9ydGluZ1xuICBhZGp1c3RtZW50cyA9IHt9XG4gIGFkanVzdCA9IChkX2ljLCBpbnRlcnZhbHMpIC0+XG4gICAgaW50ZXJ2YWxDbGFzcyArPSBkX2ljXG4gICAgYWRqdXN0bWVudHNba10gPz0gMCBmb3IgayBvZiBpbnRlcnZhbHNcbiAgICBhZGp1c3RtZW50c1trXSArPSB2IGZvciBrLCB2IG9mIGludGVydmFsc1xuICBhZGp1c3QgLTI0LCBQNTogNCwgTTM6IC0xIHdoaWxlIGludGVydmFsQ2xhc3MgPj0gMjRcbiAgYWRqdXN0IC0xMiwgTTM6IDMgd2hpbGUgaW50ZXJ2YWxDbGFzcyA+PSAxMlxuICBbcmVjb3JkLCBzaWduXSA9IFtJbnRlcnZhbFZlY3RvcnNbaW50ZXJ2YWxDbGFzc10sIDFdXG4gIFtyZWNvcmQsIHNpZ25dID0gW0ludGVydmFsVmVjdG9yc1sxMiAtIGludGVydmFsQ2xhc3NdLCAtMV0gdW5sZXNzIHJlY29yZFxuICBpbnRlcnZhbHMgPSBfLmV4dGVuZCB7bTM6IDAsIE0zOiAwLCBQNTogMCwgc2lnbjogMX0sIHJlY29yZFxuICBpbnRlcnZhbHNba10gKj0gc2lnbiBmb3IgayBvZiBpbnRlcnZhbHNcbiAgaW50ZXJ2YWxzW2tdICs9IHYgZm9yIGssIHYgb2YgYWRqdXN0bWVudHNcbiAgY29tcHV0ZWRfc2VtaXRvbmVzID0gKDEyICsgaW50ZXJ2YWxzLlA1ICogNyArIGludGVydmFscy5NMyAqIDQgKyBpbnRlcnZhbHMubTMgKiAzKSAlIDEyXG4gIHVubGVzcyBjb21wdXRlZF9zZW1pdG9uZXMgPT0gb3JpZ2luYWxfaW50ZXJ2YWxDbGFzcyAlIDEyXG4gICAgY29uc29sZS5lcnJvciBcIkVycm9yIGNvbXB1dGluZyBncmlkIHBvc2l0aW9uIGZvciAje29yaWdpbmFsX2ludGVydmFsQ2xhc3N9OlxcblwiXG4gICAgICAsIFwiICAje29yaWdpbmFsX2ludGVydmFsQ2xhc3N9IC0+XCIsIGludGVydmFsc1xuICAgICAgLCAnLT4nLCBjb21wdXRlZF9zZW1pdG9uZXNcbiAgICAgICwgJyE9Jywgb3JpZ2luYWxfaW50ZXJ2YWxDbGFzcyAlIDEyXG4gIGludGVydmFsc1xuXG5kcmF3SGFybW9uaWNUYWJsZSA9IChpbnRlcnZhbENsYXNzZXMsIG9wdGlvbnM9e30pIC0+XG4gIG9wdGlvbnMgPSBfLmV4dGVuZCB7ZHJhdzogdHJ1ZX0sIERlZmF1bHRTdHlsZSwgb3B0aW9uc1xuICBjb2xvcnMgPSBvcHRpb25zLmludGVydmFsQ2xhc3NfY29sb3JzXG4gIGludGVydmFsQ2xhc3NlcyA9IFswXS5jb25jYXQgaW50ZXJ2YWxDbGFzc2VzIHVubGVzcyAwIGluIGludGVydmFsQ2xhc3Nlc1xuICBjZWxsX3JhZGl1cyA9IG9wdGlvbnMucmFkaXVzXG4gIGhleF9yYWRpdXMgPSBjZWxsX3JhZGl1cyAvIDJcblxuICBjZWxsX2NlbnRlciA9IChpbnRlcnZhbF9rbGFzcykgLT5cbiAgICB2ZWN0b3JzID0gaW50ZXJ2YWxDbGFzc1ZlY3RvcnMgaW50ZXJ2YWxfa2xhc3NcbiAgICBkeSA9IHZlY3RvcnMuUDUgKyAodmVjdG9ycy5NMyArIHZlY3RvcnMubTMpIC8gMlxuICAgIGR4ID0gdmVjdG9ycy5NMyAtIHZlY3RvcnMubTNcbiAgICB4ID0gZHggKiBjZWxsX3JhZGl1cyAqIC44XG4gICAgeSA9IC1keSAqIGNlbGxfcmFkaXVzICogLjk1XG4gICAge3gsIHl9XG5cbiAgYm91bmRzID0ge2xlZnQ6IEluZmluaXR5LCB0b3A6IEluZmluaXR5LCByaWdodDogLUluZmluaXR5LCBib3R0b206IC1JbmZpbml0eX1cbiAgZm9yIGludGVydmFsX2tsYXNzIGluIGludGVydmFsQ2xhc3Nlc1xuICAgIHt4LCB5fSA9IGNlbGxfY2VudGVyIGludGVydmFsX2tsYXNzXG4gICAgYm91bmRzLmxlZnQgPSBNYXRoLm1pbiBib3VuZHMubGVmdCwgeCAtIGhleF9yYWRpdXNcbiAgICBib3VuZHMudG9wID0gTWF0aC5taW4gYm91bmRzLnRvcCwgeSAtIGhleF9yYWRpdXNcbiAgICBib3VuZHMucmlnaHQgPSBNYXRoLm1heCBib3VuZHMucmlnaHQsIHggKyBoZXhfcmFkaXVzXG4gICAgYm91bmRzLmJvdHRvbSA9IE1hdGgubWF4IGJvdW5kcy5ib3R0b20sIHkgKyBoZXhfcmFkaXVzXG5cbiAgcmV0dXJuIHt3aWR0aDogYm91bmRzLnJpZ2h0IC0gYm91bmRzLmxlZnQsIGhlaWdodDogYm91bmRzLmJvdHRvbSAtIGJvdW5kcy50b3B9IHVubGVzcyBvcHRpb25zLmRyYXdcblxuICB3aXRoR3JhcGhpY3NDb250ZXh0IChjdHgpIC0+XG4gICAgY3R4LnRyYW5zbGF0ZSAtYm91bmRzLmxlZnQsIC1ib3VuZHMuYm90dG9tXG5cbiAgICBmb3IgaW50ZXJ2YWxfa2xhc3MgaW4gaW50ZXJ2YWxDbGFzc2VzXG4gICAgICBpc1Jvb3QgPSBpbnRlcnZhbF9rbGFzcyA9PSAwXG4gICAgICBjb2xvciA9IGNvbG9yc1tpbnRlcnZhbF9rbGFzcyAlIDEyXVxuICAgICAgY29sb3IgfHw9IGNvbG9yc1sxMiAtIGludGVydmFsX2tsYXNzXVxuICAgICAgY3R4LmJlZ2luUGF0aCgpXG4gICAgICB7eCwgeX0gPSBjZWxsX2NlbnRlciBpbnRlcnZhbF9rbGFzc1xuXG4gICAgICAjIGZyYW1lXG4gICAgICBmb3IgaSBpbiBbMC4uNl1cbiAgICAgICAgYSA9IGkgKiBNYXRoLlBJIC8gM1xuICAgICAgICBwb3MgPSBbeCArIGhleF9yYWRpdXMgKiBNYXRoLmNvcyhhKSwgeSArIGhleF9yYWRpdXMgKiBNYXRoLnNpbihhKV1cbiAgICAgICAgY3R4Lm1vdmVUbyBwb3MuLi4gaWYgaSA9PSAwXG4gICAgICAgIGN0eC5saW5lVG8gcG9zLi4uXG4gICAgICBjdHguc3Ryb2tlU3R5bGUgPSAnZ3JheSdcbiAgICAgIGN0eC5zdHJva2UoKVxuXG4gICAgICAjIGZpbGxcbiAgICAgIGlmIGlzUm9vdCBvciAob3B0aW9ucy5maWxsX2NlbGxzIGFuZCBpbnRlcnZhbF9rbGFzcyA8IDEyKVxuICAgICAgICBjdHguZmlsbFN0eWxlID0gY29sb3Igb3IgJ3JnYmEoMjU1LDAsMCwwLjE1KSdcbiAgICAgICAgY3R4Lmdsb2JhbEFscGhhID0gMC4zIHVubGVzcyBpc1Jvb3RcbiAgICAgICAgY3R4LmZpbGwoKVxuICAgICAgICBjdHguZ2xvYmFsQWxwaGEgPSAxXG5cbiAgICAgIGNvbnRpbnVlIGlmIGlzUm9vdCBvciBvcHRpb25zLmZpbGxfY2VsbHNcblxuICAgICAgIyBmaWxsXG4gICAgICBjdHguZ2xvYmFsQWxwaGEgPSAwLjMgaWYgb3B0aW9ucy5sYWJlbF9jZWxsc1xuICAgICAgZG8gLT5cbiAgICAgICAgW2R4LCBkeSwgZG5dID0gWy15LCB4LCAyIC8gTWF0aC5zcXJ0KHgqeCArIHkqeSldXG4gICAgICAgIGR4ICo9IGRuXG4gICAgICAgIGR5ICo9IGRuXG4gICAgICAgIGN0eC5iZWdpblBhdGgoKVxuICAgICAgICBjdHgubW92ZVRvIDAsIDBcbiAgICAgICAgY3R4LmxpbmVUbyB4ICsgZHgsIHkgKyBkeVxuICAgICAgICBjdHgubGluZVRvIHggLSBkeCwgeSAtIGR5XG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSBjb2xvclxuICAgICAgICBjdHguZmlsbCgpXG5cbiAgICAgIGN0eC5iZWdpblBhdGgoKVxuICAgICAgY3R4LmFyYyB4LCB5LCAyLCAwLCAyICogTWF0aC5QSSwgZmFsc2VcbiAgICAgIGN0eC5maWxsU3R5bGUgPSBjb2xvclxuICAgICAgY3R4LmZpbGwoKVxuICAgICAgY3R4Lmdsb2JhbEFscGhhID0gMVxuXG4gICAgY3R4LmJlZ2luUGF0aCgpXG4gICAgY3R4LmFyYyAwLCAwLCAyLjUsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZVxuICAgIGN0eC5maWxsU3R5bGUgPSAncmVkJ1xuICAgIGN0eC5maWxsKClcblxuICAgIGlmIG9wdGlvbnMubGFiZWxfY2VsbHNcbiAgICAgIGZvciBpbnRlcnZhbF9rbGFzcyBpbiBpbnRlcnZhbENsYXNzZXNcbiAgICAgICAgbGFiZWwgPSBJbnRlcnZhbE5hbWVzW2ludGVydmFsX2tsYXNzXVxuICAgICAgICBsYWJlbCA9ICdSJyBpZiBpbnRlcnZhbF9rbGFzcyA9PSAwXG4gICAgICAgIHt4LCB5fSA9IGNlbGxfY2VudGVyIGludGVydmFsX2tsYXNzXG4gICAgICAgIGRyYXdUZXh0IGxhYmVsLCBmb250OiAnMTBwdCBUaW1lcycsIGZpbGxTdHlsZTogJ2JsYWNrJywgeDogeCwgeTogeSwgZ3Jhdml0eTogJ2NlbnRlcidcblxuaGFybW9uaWNUYWJsZUJsb2NrID0gKHRvbmVzLCBvcHRpb25zKSAtPlxuICBkaW1lbnNpb25zID0gZHJhd0hhcm1vbmljVGFibGUgdG9uZXMsIF8uZXh0ZW5kKHt9LCBvcHRpb25zLCBjb21wdXRlX2JvdW5kczogdHJ1ZSwgZHJhdzogZmFsc2UpXG4gIGJsb2NrXG4gICAgd2lkdGg6IGRpbWVuc2lvbnMud2lkdGhcbiAgICBoZWlnaHQ6IGRpbWVuc2lvbnMuaGVpZ2h0XG4gICAgZHJhdzogLT5cbiAgICAgIGRyYXdIYXJtb25pY1RhYmxlIHRvbmVzLCBvcHRpb25zXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBkcmF3OiBkcmF3SGFybW9uaWNUYWJsZVxuICBibG9jazogaGFybW9uaWNUYWJsZUJsb2NrXG59XG4iLCJ7aW50ZXJ2YWxDbGFzc0RpZmZlcmVuY2UsIHBpdGNoRnJvbVNjaWVudGlmaWNOb3RhdGlvbn0gPSByZXF1aXJlKCcuL3RoZW9yeScpXG5cbiNcbiMgRnJldGJvYXJkXG4jXG5cbmNsYXNzIEluc3RydW1lbnRcbiAgc3RyaW5nQ291bnQ6IDZcbiAgc3RyaW5nczogNlxuICBmcmV0Q291bnQ6IDEyXG4gIHN0cmluZ051bWJlcnM6IFswLi41XVxuICBzdHJpbmdQaXRjaGVzOiAnRTQgQjMgRzMgRDMgQTIgRTInLnNwbGl0KC9cXHMvKS5yZXZlcnNlKCkubWFwIHBpdGNoRnJvbVNjaWVudGlmaWNOb3RhdGlvblxuXG4gIGVhY2hGaW5nZXJQb3NpdGlvbjogKGZuKSAtPlxuICAgIGZvciBzdHJpbmcgaW4gQHN0cmluZ051bWJlcnNcbiAgICAgIGZvciBmcmV0IGluIFswLi5AZnJldENvdW50XVxuICAgICAgICBmbiBzdHJpbmc6IHN0cmluZywgZnJldDogZnJldFxuXG4gIHBpdGNoQXQ6ICh7c3RyaW5nLCBmcmV0fSkgLT5cbiAgICBAc3RyaW5nUGl0Y2hlc1tzdHJpbmddICsgZnJldFxuXG5GcmV0TnVtYmVycyA9IFswLi40XSAgIyBpbmNsdWRlcyBudXRcbkZyZXRDb3VudCA9IEZyZXROdW1iZXJzLmxlbmd0aCAtIDEgICMgZG9lc24ndCBpbmNsdWRlIG51dFxuXG5pbnRlcnZhbFBvc2l0aW9uc0Zyb21Sb290ID0gKGluc3RydW1lbnQsIHJvb3RQb3NpdGlvbiwgc2VtaXRvbmVzKSAtPlxuICByb290UGl0Y2ggPSBpbnN0cnVtZW50LnBpdGNoQXQocm9vdFBvc2l0aW9uKVxuICBwb3NpdGlvbnMgPSBbXVxuICBmcmV0Ym9hcmRfcG9zaXRpb25zX2VhY2ggKGZpbmdlclBvc2l0aW9uKSAtPlxuICAgIHJldHVybiB1bmxlc3MgaW50ZXJ2YWxDbGFzc0RpZmZlcmVuY2Uocm9vdFBpdGNoLCBpbnN0cnVtZW50LnBpdGNoQXQoZmluZ2VyUG9zaXRpb24pKSA9PSBzZW1pdG9uZXNcbiAgICBwb3NpdGlvbnMucHVzaCBmaW5nZXJQb3NpdGlvblxuICByZXR1cm4gcG9zaXRpb25zXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBEZWZhdWx0OiBuZXcgSW5zdHJ1bWVudFxuICBGcmV0TnVtYmVyc1xuICBGcmV0Q291bnRcbiAgaW50ZXJ2YWxQb3NpdGlvbnNGcm9tUm9vdFxufVxuIiwiZnMgPSByZXF1aXJlICdmcydcbnBhdGggPSByZXF1aXJlICdwYXRoJ1xudXRpbCA9IHJlcXVpcmUgJ3V0aWwnXG5fID0gcmVxdWlyZSAndW5kZXJzY29yZSdcbkNhbnZhcyA9IHJlcXVpcmUgJ2NhbnZhcydcblxuXG4jXG4jIERyYXdpbmdcbiNcblxuQ29udGV4dCA9XG4gIGNhbnZhczogbnVsbFxuICBjdHg6IG51bGxcblxuZXJhc2VfYmFja2dyb3VuZCA9IC0+XG4gIHtjYW52YXMsIGN0eH0gPSBDb250ZXh0XG4gIGN0eC5maWxsU3R5bGUgPSAnd2hpdGUnXG4gIGN0eC5maWxsUmVjdCAwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHRcblxubWVhc3VyZV90ZXh0ID0gKHRleHQsIHtmb250fT17fSkgLT5cbiAgY3R4ID0gQ29udGV4dC5jdHhcbiAgY3R4LmZvbnQgPSBmb250IGlmIGZvbnRcbiAgY3R4Lm1lYXN1cmVUZXh0IHRleHRcblxuZHJhd1RleHQgPSAodGV4dCwgb3B0aW9ucz17fSkgLT5cbiAgY3R4ID0gQ29udGV4dC5jdHhcbiAgb3B0aW9ucyA9IHRleHQgaWYgXy5pc09iamVjdCB0ZXh0XG4gIHtmb250LCBmaWxsU3R5bGUsIHgsIHksIGdyYXZpdHksIHdpZHRofSA9IG9wdGlvbnNcbiAgZ3Jhdml0eSB8fD0gJydcbiAgaWYgb3B0aW9ucy5jaG9pY2VzXG4gICAgZm9yIGNob2ljZSBpbiBvcHRpb25zLmNob2ljZXNcbiAgICAgIHRleHQgPSBjaG9pY2UgaWYgXy5pc1N0cmluZyBjaG9pY2VcbiAgICAgIHtmb250fSA9IGNob2ljZSBpZiBfLmlzT2JqZWN0IGNob2ljZVxuICAgICAgYnJlYWsgaWYgbWVhc3VyZV90ZXh0KHRleHQsIGZvbnQ6IGZvbnQpLndpZHRoIDw9IG9wdGlvbnMud2lkdGhcbiAgY3R4LmZvbnQgPSBmb250IGlmIGZvbnRcbiAgY3R4LmZpbGxTdHlsZSA9IGZpbGxTdHlsZSBpZiBmaWxsU3R5bGVcbiAgbSA9IGN0eC5tZWFzdXJlVGV4dCB0ZXh0XG4gIHggfHw9IDBcbiAgeSB8fD0gMFxuICB4IC09IG0ud2lkdGggLyAyIGlmIGdyYXZpdHkubWF0Y2goL14odG9wfGNlbnRlcnxtaWRkbGV8Y2VudGVyYm90dG9tKSQvaSlcbiAgeCAtPSBtLndpZHRoIGlmIGdyYXZpdHkubWF0Y2goL14ocmlnaHR8dG9wUmlnaHR8Ym90UmlnaHQpJC9pKVxuICB5IC09IG0uZW1IZWlnaHREZXNjZW50IGlmIGdyYXZpdHkubWF0Y2goL14oYm90dG9tfGJvdExlZnR8Ym90UmlnaHQpJC9pKVxuICB5ICs9IG0uZW1IZWlnaHRBc2NlbnQgaWYgZ3Jhdml0eS5tYXRjaCgvXih0b3B8dG9wTGVmdHx0b3BSaWdodCkkL2kpXG4gIGN0eC5maWxsVGV4dCB0ZXh0LCB4LCB5XG5cbndpdGhDYW52YXMgPSAoY2FudmFzLCBjYikgLT5cbiAgc2F2ZWRDYW52YXMgPSBDb250ZXh0LmNhbnZhc1xuICBzYXZlZENvbnRleHQgPSBDb250ZXh0LmNvbnRleHRcbiAgdHJ5XG4gICAgQ29udGV4dC5jYW52YXMgPSBjYW52YXNcbiAgICBDb250ZXh0LmN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpXG4gICAgcmV0dXJuIGNiKClcbiAgZmluYWxseVxuICAgIENvbnRleHQuY2FudmFzID0gc2F2ZWRDYW52YXNcbiAgICBDb250ZXh0LmNvbnRleHQgPSBzYXZlZENvbnRleHRcblxud2l0aEdyYXBoaWNzQ29udGV4dCA9IChmbikgLT5cbiAgY3R4ID0gQ29udGV4dC5jdHhcbiAgY3R4LnNhdmUoKVxuICB0cnlcbiAgICBmbiBjdHhcbiAgZmluYWxseVxuICAgIGN0eC5yZXN0b3JlKClcblxuXG4jXG4jIEJveC1iYXNlZCBEZWNsYXJhdGl2ZSBMYXlvdXRcbiNcblxuYm94ID0gKHBhcmFtcykgLT5cbiAgYm94ID0gXy5leHRlbmQge3dpZHRoOiAwfSwgcGFyYW1zXG4gIGJveC5oZWlnaHQgPz0gKGJveC5hc2NlbnQgPyAwKSArIChib3guZGVzY2VudCA/IDApXG4gIGJveC5hc2NlbnQgPz0gYm94LmhlaWdodCAtIChib3guZGVzY2VudCA/IDApXG4gIGJveC5kZXNjZW50ID89IGJveC5oZWlnaHQgLSBib3guYXNjZW50XG4gIGJveFxuXG5wYWRCb3ggPSAoYm94LCBvcHRpb25zKSAtPlxuICBib3guaGVpZ2h0ICs9IG9wdGlvbnMuYm90dG9tIGlmIG9wdGlvbnMuYm90dG9tXG4gIGJveC5kZXNjZW50ID0gKChib3guZGVzY2VudCA/IDApICsgb3B0aW9ucy5ib3R0b20pIGlmIG9wdGlvbnMuYm90dG9tXG4gIGJveFxuXG50ZXh0Qm94ID0gKHRleHQsIG9wdGlvbnMpIC0+XG4gIG9wdGlvbnMgPSBfLmV4dGVuZCB7fSwgb3B0aW9ucywgZ3Jhdml0eTogZmFsc2VcbiAgbWVhc3VyZSA9IG1lYXN1cmVfdGV4dCB0ZXh0LCBvcHRpb25zXG4gIGJveFxuICAgIHdpZHRoOiBtZWFzdXJlLndpZHRoXG4gICAgaGVpZ2h0OiBtZWFzdXJlLmVtSGVpZ2h0QXNjZW50ICsgbWVhc3VyZS5lbUhlaWdodERlc2NlbnRcbiAgICBkZXNjZW50OiBtZWFzdXJlLmVtSGVpZ2h0RGVzY2VudFxuICAgIGRyYXc6IC0+IGRyYXdUZXh0IHRleHQsIG9wdGlvbnNcblxudmJveCA9IChib3hlcy4uLikgLT5cbiAgb3B0aW9ucyA9IHt9XG4gIG9wdGlvbnMgPSBib3hlcy5wb3AoKSB1bmxlc3MgYm94ZXNbYm94ZXMubGVuZ3RoIC0gMV0ud2lkdGg/XG4gIG9wdGlvbnMgPSBfLmV4dGVuZCB7YWxpZ246ICdsZWZ0J30sIG9wdGlvbnNcbiAgd2lkdGggPSBNYXRoLm1heCBfLnBsdWNrKGJveGVzLCAnd2lkdGgnKS4uLlxuICBoZWlnaHQgPSBfLnBsdWNrKGJveGVzLCAnaGVpZ2h0JykucmVkdWNlIChhLCBiKSAtPiBhICsgYlxuICBkZXNjZW50ID0gYm94ZXNbYm94ZXMubGVuZ3RoIC0gMV0uZGVzY2VudFxuICBpZiBvcHRpb25zLmJhc2VsaW5lXG4gICAgYm94ZXNfYmVsb3cgPSBib3hlc1tib3hlcy5pbmRleE9mKG9wdGlvbnMuYmFzZWxpbmUpKzEuLi5dXG4gICAgZGVzY2VudCA9IG9wdGlvbnMuYmFzZWxpbmUuZGVzY2VudCArIF8ucGx1Y2soYm94ZXNfYmVsb3csICdoZWlnaHQnKS5yZWR1Y2UgKChhLCBiKSAtPiBhICsgYiksIDBcbiAgYm94XG4gICAgd2lkdGg6IHdpZHRoXG4gICAgaGVpZ2h0OiBoZWlnaHRcbiAgICBkZXNjZW50OiBkZXNjZW50XG4gICAgZHJhdzogLT5cbiAgICAgIGR5ID0gLWhlaWdodFxuICAgICAgYm94ZXMuZm9yRWFjaCAoYjEpIC0+XG4gICAgICAgIHdpdGhHcmFwaGljc0NvbnRleHQgKGN0eCkgLT5cbiAgICAgICAgICBkeCA9IHN3aXRjaCBvcHRpb25zLmFsaWduXG4gICAgICAgICAgICB3aGVuICdsZWZ0JyB0aGVuIDBcbiAgICAgICAgICAgIHdoZW4gJ2NlbnRlcicgdGhlbiBNYXRoLm1heCAwLCAod2lkdGggLSBiMS53aWR0aCkgLyAyXG4gICAgICAgICAgY3R4LnRyYW5zbGF0ZSBkeCwgZHkgKyBiMS5oZWlnaHQgLSBiMS5kZXNjZW50XG4gICAgICAgICAgYjEuZHJhdz8oY3R4KVxuICAgICAgICAgIGR5ICs9IGIxLmhlaWdodFxuXG5hYm92ZSA9IHZib3hcblxuaGJveCA9IChiMSwgYjIpIC0+XG4gIGNvbnRhaW5lcl9zaXplID0gQ3VycmVudEJvb2s/LnBhZ2Vfb3B0aW9ucyBvciBDdXJyZW50UGFnZVxuICBib3hlcyA9IFtiMSwgYjJdXG4gIGhlaWdodCA9IE1hdGgubWF4IF8ucGx1Y2soYm94ZXMsICdoZWlnaHQnKS4uLlxuICB3aWR0aCA9IF8ucGx1Y2soYm94ZXMsICd3aWR0aCcpLnJlZHVjZSAoYSwgYikgLT4gYSArIGJcbiAgd2lkdGggPSBjb250YWluZXJfc2l6ZS53aWR0aCBpZiB3aWR0aCA9PSBJbmZpbml0eVxuICBzcHJpbmdfY291bnQgPSAoYiBmb3IgYiBpbiBib3hlcyB3aGVuIGIud2lkdGggPT0gSW5maW5pdHkpLmxlbmd0aFxuICBib3hcbiAgICB3aWR0aDogd2lkdGhcbiAgICBoZWlnaHQ6IGhlaWdodFxuICAgIGRyYXc6IC0+XG4gICAgICB4ID0gMFxuICAgICAgYm94ZXMuZm9yRWFjaCAoYikgLT5cbiAgICAgICAgd2l0aEdyYXBoaWNzQ29udGV4dCAoY3R4KSAtPlxuICAgICAgICAgIGN0eC50cmFuc2xhdGUgeCwgMFxuICAgICAgICAgIGIuZHJhdz8oY3R4KVxuICAgICAgICBpZiBiLndpZHRoID09IEluZmluaXR5XG4gICAgICAgICAgeCArPSAod2lkdGggLSAod2lkdGggZm9yIHt3aWR0aH0gaW4gYm94ZXMgd2hlbiB3aWR0aCAhPSBJbmZpbml0eSkucmVkdWNlIChhLCBiKSAtPiBhICsgYikgLyBzcHJpbmdfY291bnRcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHggKz0gYi53aWR0aFxuXG5vdmVybGF5ID0gKGJveGVzLi4uKSAtPlxuICBib3hcbiAgICB3aWR0aDogTWF0aC5tYXggXy5wbHVjayhib3hlcywgJ3dpZHRoJykuLi5cbiAgICBoZWlnaHQ6IE1hdGgubWF4IF8ucGx1Y2soYm94ZXMsICdoZWlnaHQnKS4uLlxuICAgIGRyYXc6IC0+XG4gICAgICBmb3IgYiBpbiBib3hlc1xuICAgICAgICB3aXRoR3JhcGhpY3NDb250ZXh0IChjdHgpIC0+XG4gICAgICAgICAgYi5kcmF3IGN0eFxuXG5sYWJlbGVkID0gKHRleHQsIG9wdGlvbnMsIGJveCkgLT5cbiAgW29wdGlvbnMsIGJveF0gPSBbe30sIG9wdGlvbnNdIGlmIGFyZ3VtZW50cy5sZW5ndGggPT0gMlxuICBkZWZhdWx0X29wdGlvbnMgPVxuICAgIGZvbnQ6ICcxMnB4IFRpbWVzJ1xuICAgIGZpbGxTdHlsZTogJ2JsYWNrJ1xuICBvcHRpb25zID0gXy5leHRlbmQgZGVmYXVsdF9vcHRpb25zLCBvcHRpb25zXG4gIGFib3ZlIHRleHRCb3godGV4dCwgb3B0aW9ucyksIGJveCwgb3B0aW9uc1xuXG53aXRoR3JpZEJveGVzID0gKG9wdGlvbnMsIGdlbmVyYXRvcikgLT5cbiAge21heCwgZmxvb3J9ID0gTWF0aFxuXG4gIG9wdGlvbnMgPSBfLmV4dGVuZCB7aGVhZGVyX2hlaWdodDogMCwgZ3V0dGVyX3dpZHRoOiAxMCwgZ3V0dGVyX2hlaWdodDogMTB9LCBvcHRpb25zXG4gIGNvbnRhaW5lcl9zaXplID0gQ3VycmVudEJvb2s/LnBhZ2Vfb3B0aW9ucyBvciBDdXJyZW50UGFnZVxuXG4gIGxpbmVfYnJlYWsgPSB7d2lkdGg6IDAsIGhlaWdodDogMCwgbGluZWJyZWFrOiB0cnVlfVxuICBoZWFkZXIgPSBudWxsXG4gIGNlbGxzID0gW11cbiAgZ2VuZXJhdG9yXG4gICAgaGVhZGVyOiAoYm94KSAtPiBoZWFkZXIgPSBib3hcbiAgICBzdGFydFJvdzogKCkgLT4gY2VsbHMucHVzaCBsaW5lX2JyZWFrXG4gICAgY2VsbDogKGJveCkgLT4gY2VsbHMucHVzaCBib3hcbiAgICBjZWxsczogKGJveGVzKSAtPiBjZWxscy5wdXNoIGIgZm9yIGIgaW4gYm94ZXNcblxuICBjZWxsX3dpZHRoID0gbWF4IF8ucGx1Y2soY2VsbHMsICd3aWR0aCcpLi4uXG4gIGNlbGxfaGVpZ2h0ID0gbWF4IF8ucGx1Y2soY2VsbHMsICdoZWlnaHQnKS4uLlxuICAjIGNlbGwuZGVzY2VudCA/PSAwIGZvciBjZWxsIGluIGNlbGxzXG5cbiAgXy5leHRlbmQgb3B0aW9uc1xuICAgICwgaGVhZGVyX2hlaWdodDogaGVhZGVyPy5oZWlnaHQgb3IgMFxuICAgICwgY2VsbF93aWR0aDogY2VsbF93aWR0aFxuICAgICwgY2VsbF9oZWlnaHQ6IGNlbGxfaGVpZ2h0XG4gICAgLCBjb2xzOiBtYXggMSwgZmxvb3IoKGNvbnRhaW5lcl9zaXplLndpZHRoICsgb3B0aW9ucy5ndXR0ZXJfd2lkdGgpIC8gKGNlbGxfd2lkdGggKyBvcHRpb25zLmd1dHRlcl93aWR0aCkpXG4gIG9wdGlvbnMucm93cyA9IGRvIC0+XG4gICAgY29udGVudF9oZWlnaHQgPSBjb250YWluZXJfc2l6ZS5oZWlnaHQgLSBvcHRpb25zLmhlYWRlcl9oZWlnaHRcbiAgICBjZWxsX2hlaWdodCA9IGNlbGxfaGVpZ2h0ICsgb3B0aW9ucy5ndXR0ZXJfaGVpZ2h0XG4gICAgbWF4IDEsIGZsb29yKChjb250ZW50X2hlaWdodCArIG9wdGlvbnMuZ3V0dGVyX2hlaWdodCkgLyBjZWxsX2hlaWdodClcblxuICBjZWxsLmRlc2NlbnQgPz0gMCBmb3IgY2VsbCBpbiBjZWxsc1xuICBtYXhfZGVzY2VudCA9IG1heCBfLnBsdWNrKGNlbGxzLCAnZGVzY2VudCcpLi4uXG4gICMgY29uc29sZS5pbmZvICdkZXNjZW50JywgbWF4X2Rlc2NlbnQsICdmcm9tJywgXy5wbHVjayhjZWxscywgJ2Rlc2NlbnQnKVxuXG4gIHdpdGhHcmlkIG9wdGlvbnMsIChncmlkKSAtPlxuICAgIGlmIGhlYWRlclxuICAgICAgd2l0aEdyYXBoaWNzQ29udGV4dCAoY3R4KSAtPlxuICAgICAgICBjdHgudHJhbnNsYXRlIDAsIGhlYWRlci5oZWlnaHQgLSBoZWFkZXIuZGVzY2VudFxuICAgICAgICBoZWFkZXI/LmRyYXcgY3R4XG4gICAgY2VsbHMuZm9yRWFjaCAoY2VsbCkgLT5cbiAgICAgIGdyaWQuc3RhcnRSb3coKSBpZiBjZWxsLmxpbmVicmVhaz9cbiAgICAgIHJldHVybiBpZiBjZWxsID09IGxpbmVfYnJlYWtcbiAgICAgIGdyaWQuYWRkX2NlbGwgLT5cbiAgICAgICAgd2l0aEdyYXBoaWNzQ29udGV4dCAoY3R4KSAtPlxuICAgICAgICAgIGN0eC50cmFuc2xhdGUgMCwgY2VsbF9oZWlnaHQgLSBjZWxsLmRlc2NlbnRcbiAgICAgICAgICBjZWxsLmRyYXcgY3R4XG5cblxuI1xuIyBGaWxlIFNhdmluZ1xuI1xuXG5CdWlsZERpcmVjdG9yeSA9ICcuJ1xuRGVmYXVsdEZpbGVuYW1lID0gbnVsbFxuXG5kaXJlY3RvcnkgPSAocGF0aCkgLT4gQnVpbGREaXJlY3RvcnkgPSBwYXRoXG5maWxlbmFtZSA9IChuYW1lKSAtPiBEZWZhdWx0RmlsZW5hbWUgPSBuYW1lXG5cbnNhdmVfY2FudmFzX3RvX3BuZyA9IChjYW52YXMsIGZuYW1lKSAtPlxuICBvdXQgPSBmcy5jcmVhdGVXcml0ZVN0cmVhbShwYXRoLmpvaW4oQnVpbGREaXJlY3RvcnksIGZuYW1lKSlcbiAgc3RyZWFtID0gY2FudmFzLnBuZ1N0cmVhbSgpXG4gIHN0cmVhbS5vbiAnZGF0YScsIChjaHVuaykgLT4gb3V0LndyaXRlKGNodW5rKVxuICBzdHJlYW0ub24gJ2VuZCcsICgpIC0+IGNvbnNvbGUuaW5mbyBcIlNhdmVkICN7Zm5hbWV9XCJcblxuXG4jXG4jIFBhcGVyIFNpemVzXG4jXG5cblBhcGVyU2l6ZXMgPVxuICBmb2xpbzogJzEyaW4geCAxNWluJ1xuICBxdWFydG86ICc5LjVpbiB4IDEyaW4nXG4gIG9jdGF2bzogJzZpbiB4IDlpbidcbiAgZHVvZGVjaW1vOiAnNWluIHggNy4zNzVpbidcbiAgIyBBTlNJIHNpemVzXG4gICdBTlNJIEEnOiAnOC41aW4gw5cgMTFpbidcbiAgJ0FOU0kgQic6ICcxMWluIHggMTdpbidcbiAgbGV0dGVyOiAnQU5TSSBBJ1xuICBsZWRnZXI6ICdBTlNJIEIgbGFuZHNjYXBlJ1xuICB0YWJsb2lkOiAnQU5TSSBCIHBvcnRyYWl0J1xuICAnQU5TSSBDJzogJzE3aW4gw5cgMjJpbidcbiAgJ0FOU0kgRCc6ICcyMmluIMOXIDM0aW4nXG4gICdBTlNJIEUnOiAnMzRpbiDDlyA0NGluJ1xuXG5nZXRfcGFnZV9zaXplX2RpbWVuc2lvbnMgPSAoc2l6ZSwgb3JpZW50YXRpb249bnVsbCkgLT5cbiAgcGFyc2VNZWFzdXJlID0gKG1lYXN1cmUpIC0+XG4gICAgcmV0dXJuIG1lYXN1cmUgaWYgdHlwZW9mIG1lYXN1cmUgPT0gJ251bWJlcidcbiAgICB1bmxlc3MgbWVhc3VyZS5tYXRjaCAvXihcXGQrKD86XFwuXFxkKik/KVxccyooLispJC9cbiAgICAgIHRocm93IG5ldyBFcnJvciBcIlVucmVjb2duaXplZCBtZWFzdXJlICN7dXRpbC5pbnNwZWN0IG1lYXN1cmV9IGluICN7dXRpbC5pbnNwZWN0IHNpemV9XCJcbiAgICBbbiwgdW5pdHNdID0gW051bWJlcihSZWdFeHAuJDEpLCBSZWdFeHAuJDJdXG4gICAgc3dpdGNoIHVuaXRzXG4gICAgICB3aGVuIFwiXCIgdGhlbiBuXG4gICAgICB3aGVuIFwiaW5cIiB0aGVuIG4gKiA3MlxuICAgICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IgXCJVbnJlY29nbml6ZWQgdW5pdHMgI3t1dGlsLmluc3BlY3QgdW5pdHN9IGluICN7dXRpbC5pbnNwZWN0IHNpemV9XCJcblxuICB7d2lkdGgsIGhlaWdodH0gPSBzaXplXG4gIHdoaWxlIF8uaXNTdHJpbmcoc2l6ZSlcbiAgICBbc2l6ZSwgb3JpZW50YXRpb25dID0gW1JlZ0V4cC4kMSwgUmVnRXhwLlIyXSBpZiBzaXplLm1hdGNoIC9eKC4rKVxccysobGFuZHNjYXBlfHBvcnRyYWl0KSQvXG4gICAgYnJlYWsgdW5sZXNzIHNpemUgb2YgUGFwZXJTaXplc1xuICAgIHNpemUgPSBQYXBlclNpemVzW3NpemVdXG4gICAge3dpZHRoLCBoZWlnaHR9ID0gc2l6ZVxuICBpZiBfLmlzU3RyaW5nKHNpemUpXG4gICAgdGhyb3cgbmV3IEVycm9yIFwiVW5yZWNvZ25pemVkIGJvb2sgc2l6ZSBmb3JtYXQgI3t1dGlsLmluc3BlY3Qgc2l6ZX1cIiB1bmxlc3Mgc2l6ZS5tYXRjaCAvXiguKz8pXFxzKlt4w5ddXFxzKiguKykkL1xuICAgIFt3aWR0aCwgaGVpZ2h0XSA9IFtSZWdFeHAuJDEsIFJlZ0V4cC4kMl1cblxuICBbd2lkdGgsIGhlaWdodF0gPSBbcGFyc2VNZWFzdXJlKHdpZHRoKSwgcGFyc2VNZWFzdXJlKGhlaWdodCldXG4gIHN3aXRjaCBvcmllbnRhdGlvbiBvciAnJ1xuICAgIHdoZW4gJ2xhbmRzY2FwZScgdGhlbiBbd2lkdGgsIGhlaWdodF0gPSBbaGVpZ2h0LCB3aWR0aF0gdW5sZXNzIHdpZHRoID4gaGVpZ2h0XG4gICAgd2hlbiAncG9ydHJhaXQnIHRoZW4gW3dpZHRoLCBoZWlnaHRdID0gW2hlaWdodCwgd2lkdGhdIGlmIHdpZHRoID4gaGVpZ2h0XG4gICAgd2hlbiAnJyB0aGVuIG51bGxcbiAgICBlbHNlIHRocm93IG5ldyBFcnJvciBcIlVua25vd24gb3JpZW50YXRpb24gI3t1dGlsLmluc3BlY3Qgb3JpZW50YXRpb259XCJcbiAge3dpZHRoLCBoZWlnaHR9XG5cbmRvIC0+XG4gIGZvciBuYW1lLCB2YWx1ZSBvZiBQYXBlclNpemVzXG4gICAgUGFwZXJTaXplc1tuYW1lXSA9IGdldF9wYWdlX3NpemVfZGltZW5zaW9ucyB2YWx1ZVxuXG5cbiNcbiMgTGF5b3V0XG4jXG5cbkN1cnJlbnRQYWdlID0gbnVsbFxuQ3VycmVudEJvb2sgPSBudWxsXG5Nb2RlID0gbnVsbFxuXG5fLm1peGluXG4gIHN1bTpcbiAgICBkbyAocGx1cz0oYSxiKSAtPiBhK2IpIC0+XG4gICAgICAoeHMpIC0+IF8ucmVkdWNlKHhzLCBwbHVzLCAwKVxuXG5URExSTGF5b3V0ID0gKGJveGVzKSAtPlxuICBwYWdlX3dpZHRoID0gQ3VycmVudFBhZ2Uud2lkdGggLSBDdXJyZW50UGFnZS5sZWZ0X21hcmdpbiAtIEN1cnJlbnRQYWdlLnRvcF9tYXJnaW5cbiAgYm94ZXMgPSBib3hlc1suLl1cbiAgYi5kZXNjZW50ID89IDAgZm9yIGIgaW4gYm94ZXNcbiAgZHkgPSAwXG4gIHdpZHRoID0gMFxuICB3aGlsZSBib3hlcy5sZW5ndGhcbiAgICBjb25zb2xlLmluZm8gJ25leHQnLCBib3hlcy5sZW5ndGhcbiAgICBsaW5lID0gW11cbiAgICB3aGlsZSBib3hlcy5sZW5ndGhcbiAgICAgIGIgPSBib3hlc1swXVxuICAgICAgYnJlYWsgaWYgd2lkdGggKyBiLndpZHRoID4gcGFnZV93aWR0aCBhbmQgbGluZS5sZW5ndGggPiAwXG4gICAgICBsaW5lLnB1c2ggYlxuICAgICAgYm94ZXMuc2hpZnQoKVxuICAgICAgd2lkdGggKz0gYi53aWR0aFxuICAgIGFzY2VudCA9IF8ubWF4KGIuaGVpZ2h0IC0gYi5kZXNjZW50IGZvciBiIGluIGxpbmUpXG4gICAgZGVzY2VudCA9IF8uY2hhaW4obGluZSkucGx1Y2soJ2Rlc2NlbnQnKS5tYXgoKVxuICAgIGR4ID0gMFxuICAgIGNvbnNvbGUuaW5mbyAnZHJhdycsIGxpbmUubGVuZ3RoXG4gICAgZm9yIGIgaW4gbGluZVxuICAgICAgd2l0aEdyYXBoaWNzQ29udGV4dCAoY3R4KSAtPlxuICAgICAgICBjdHgudHJhbnNsYXRlIGR4LCBkeSArIGFzY2VudFxuICAgICAgICBjb25zb2xlLmluZm8gJ2RyYXcnLCBkeCwgZHkgKyBhc2NlbnQsIGIuZHJhd1xuICAgICAgICBiLmRyYXcgY3R4XG4gICAgICBkeCArPSBiLndpZHRoXG4gICAgZHkgKz0gYXNjZW50ICsgZGVzY2VudFxuXG53aXRoUGFnZSA9IChvcHRpb25zLCBkcmF3X3BhZ2UpIC0+XG4gIHRocm93IG5ldyBFcnJvciBcIkFscmVhZHkgaW5zaWRlIGEgcGFnZVwiIGlmIEN1cnJlbnRQYWdlXG4gIGRlZmF1bHRzID0ge3dpZHRoOiAxMDAsIGhlaWdodDogMTAwLCBwYWdlX21hcmdpbjogMTB9XG4gIHt3aWR0aCwgaGVpZ2h0LCBwYWdlX21hcmdpbn0gPSBfLmV4dGVuZCBkZWZhdWx0cywgb3B0aW9uc1xuICB7bGVmdF9tYXJnaW4sIHRvcF9tYXJnaW4sIHJpZ2h0X21hcmdpbiwgYm90dG9tX21hcmdpbn0gPSBvcHRpb25zXG4gIGxlZnRfbWFyZ2luID89IHBhZ2VfbWFyZ2luXG4gIHRvcF9tYXJnaW4gPz0gcGFnZV9tYXJnaW5cbiAgcmlnaHRfbWFyZ2luID89IHBhZ2VfbWFyZ2luXG4gIGJvdHRvbV9tYXJnaW4gPz0gcGFnZV9tYXJnaW5cblxuICBjYW52YXMgPSBDb250ZXh0LmNhbnZhcyB8fD1cbiAgICBuZXcgQ2FudmFzIHdpZHRoICsgbGVmdF9tYXJnaW4gKyByaWdodF9tYXJnaW4sIGhlaWdodCArIHRvcF9tYXJnaW4gKyBib3R0b21fbWFyZ2luLCBNb2RlXG4gIGN0eCA9IENvbnRleHQuY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJylcbiAgY3R4LnRleHREcmF3aW5nTW9kZSA9ICdnbHlwaCcgaWYgTW9kZSA9PSAncGRmJ1xuICBib3hlcyA9IFtdXG5cbiAgdHJ5XG4gICAgcGFnZSA9XG4gICAgICBsZWZ0X21hcmdpbjogbGVmdF9tYXJnaW5cbiAgICAgIHRvcF9tYXJnaW46IHRvcF9tYXJnaW5cbiAgICAgIHJpZ2h0X21hcmdpbjogcmlnaHRfbWFyZ2luXG4gICAgICBib3R0b21fbWFyZ2luOiBib3R0b21fbWFyZ2luXG4gICAgICB3aWR0aDogY2FudmFzLndpZHRoXG4gICAgICBoZWlnaHQ6IGNhbnZhcy5oZWlnaHRcbiAgICAgIGNvbnRleHQ6IGN0eFxuICAgICAgYm94OiAob3B0aW9ucykgLT5cbiAgICAgICAgYm94ZXMucHVzaCBib3gob3B0aW9ucylcbiAgICBDdXJyZW50UGFnZSA9IHBhZ2VcblxuICAgIGVyYXNlX2JhY2tncm91bmQoKVxuXG4gICAgd2l0aEdyYXBoaWNzQ29udGV4dCAoY3R4KSAtPlxuICAgICAgY3R4LnRyYW5zbGF0ZSBsZWZ0X21hcmdpbiwgYm90dG9tX21hcmdpblxuICAgICAgQ3VycmVudEJvb2s/LmhlYWRlcj8gcGFnZVxuICAgICAgQ3VycmVudEJvb2s/LmZvb3Rlcj8gcGFnZVxuICAgICAgZHJhd19wYWdlPyBwYWdlXG4gICAgICBURExSTGF5b3V0IGJveGVzXG5cbiAgICBzd2l0Y2ggTW9kZVxuICAgICAgd2hlbiAncGRmJyB0aGVuIGN0eC5hZGRQYWdlKClcbiAgICAgIGVsc2VcbiAgICAgICAgZmlsZW5hbWUgPSBcIiN7RGVmYXVsdEZpbGVuYW1lIG9yICd0ZXN0J30ucG5nXCJcbiAgICAgICAgZnMud3JpdGVGaWxlIHBhdGguam9pbihCdWlsZERpcmVjdG9yeSwgZmlsZW5hbWUpLCBjYW52YXMudG9CdWZmZXIoKVxuICAgICAgICBjb25zb2xlLmluZm8gXCJTYXZlZCAje2ZpbGVuYW1lfVwiXG4gIGZpbmFsbHlcbiAgICBDdXJyZW50UGFnZSA9IG51bGxcblxud2l0aEdyaWQgPSAob3B0aW9ucywgY2IpIC0+XG4gIGRlZmF1bHRzID0ge2d1dHRlcl93aWR0aDogMTAsIGd1dHRlcl9oZWlnaHQ6IDEwLCBoZWFkZXJfaGVpZ2h0OiAwfVxuICBvcHRpb25zID0gXy5leHRlbmQgZGVmYXVsdHMsIG9wdGlvbnNcbiAge2NvbHMsIHJvd3MsIGNlbGxfd2lkdGgsIGNlbGxfaGVpZ2h0LCBoZWFkZXJfaGVpZ2h0LCBndXR0ZXJfd2lkdGgsIGd1dHRlcl9oZWlnaHR9ID0gb3B0aW9uc1xuICBvcHRpb25zLndpZHRoIHx8PSBjb2xzICogY2VsbF93aWR0aCArIChjb2xzIC0gMSkgKiBndXR0ZXJfd2lkdGhcbiAgb3B0aW9ucy5oZWlnaHQgfHw9ICBoZWFkZXJfaGVpZ2h0ICsgcm93cyAqIGNlbGxfaGVpZ2h0ICsgKHJvd3MgLSAxKSAqIGd1dHRlcl9oZWlnaHRcbiAgb3ZlcmZsb3cgPSBbXVxuICB3aXRoUGFnZSBvcHRpb25zLCAocGFnZSkgLT5cbiAgICBjYlxuICAgICAgY29udGV4dDogcGFnZS5jb250ZXh0XG4gICAgICByb3dzOiByb3dzXG4gICAgICBjb2xzOiBjb2xzXG4gICAgICByb3c6IDBcbiAgICAgIGNvbDogMFxuICAgICAgYWRkX2NlbGw6IChkcmF3X2ZuKSAtPlxuICAgICAgICBbY29sLCByb3ddID0gW0Bjb2wsIEByb3ddXG4gICAgICAgIGlmIHJvdyA+PSByb3dzXG4gICAgICAgICAgb3ZlcmZsb3cucHVzaCB7Y29sLCByb3csIGRyYXdfZm59XG4gICAgICAgIGVsc2VcbiAgICAgICAgICB3aXRoR3JhcGhpY3NDb250ZXh0IChjdHgpIC0+XG4gICAgICAgICAgICBjdHgudHJhbnNsYXRlIGNvbCAqIChjZWxsX3dpZHRoICsgZ3V0dGVyX3dpZHRoKSwgaGVhZGVyX2hlaWdodCArIHJvdyAqIChjZWxsX2hlaWdodCArIGd1dHRlcl9oZWlnaHQpXG4gICAgICAgICAgICBkcmF3X2ZuKClcbiAgICAgICAgY29sICs9IDFcbiAgICAgICAgW2NvbCwgcm93XSA9IFswLCByb3cgKyAxXSBpZiBjb2wgPj0gY29sc1xuICAgICAgICBbQGNvbCwgQHJvd10gPSBbY29sLCByb3ddXG4gICAgICBzdGFydFJvdzogLT5cbiAgICAgICAgW0Bjb2wsIEByb3ddID0gWzAsIEByb3cgKyAxXSBpZiBAY29sID4gMFxuICB3aGlsZSBvdmVyZmxvdy5sZW5ndGhcbiAgICBjZWxsLnJvdyAtPSByb3dzIGZvciBjZWxsIGluIG92ZXJmbG93XG4gICAgd2l0aFBhZ2Ugb3B0aW9ucywgKHBhZ2UpIC0+XG4gICAgICBmb3Ige2NvbCwgcm93LCBkcmF3X2ZufSBpbiBfLnNlbGVjdChvdmVyZmxvdywgKGNlbGwpIC0+IGNlbGwucm93IDwgcm93cylcbiAgICAgICAgd2l0aEdyYXBoaWNzQ29udGV4dCAoY3R4KSAtPlxuICAgICAgICAgIGN0eC50cmFuc2xhdGUgY29sICogKGNlbGxfd2lkdGggKyBndXR0ZXJfd2lkdGgpLCBoZWFkZXJfaGVpZ2h0ICsgcm93ICogKGNlbGxfaGVpZ2h0ICsgZ3V0dGVyX2hlaWdodClcbiAgICAgICAgICBkcmF3X2ZuKClcbiAgICBvdmVyZmxvdyA9IChjZWxsIGZvciBjZWxsIGluIG92ZXJmbG93IHdoZW4gY2VsbC5yb3cgPj0gcm93cylcblxud2l0aEJvb2sgPSAoZmlsZW5hbWUsIG9wdGlvbnMsIGNiKSAtPlxuICB0aHJvdyBuZXcgRXJyb3IgXCJ3aXRoQm9vayBjYWxsZWQgcmVjdXJzaXZlbHlcIiBpZiBDdXJyZW50Qm9va1xuICBbb3B0aW9ucywgY2JdID0gW3t9LCBvcHRpb25zXSBpZiBfLmlzRnVuY3Rpb24ob3B0aW9ucylcbiAgcGFnZV9saW1pdCA9IG9wdGlvbnMucGFnZV9saW1pdFxuICBwYWdlX2NvdW50ID0gMFxuXG4gIHRyeVxuICAgIGJvb2sgPVxuICAgICAgcGFnZV9vcHRpb25zOiB7fVxuXG4gICAgTW9kZSA9ICdwZGYnXG4gICAgQ3VycmVudEJvb2sgPSBib29rXG5cbiAgICBzaXplID0gb3B0aW9ucy5zaXplXG4gICAgaWYgc2l6ZVxuICAgICAge3dpZHRoLCBoZWlnaHR9ID0gZ2V0X3BhZ2Vfc2l6ZV9kaW1lbnNpb25zIHNpemVcbiAgICAgIF8uZXh0ZW5kIGJvb2sucGFnZV9vcHRpb25zLCB7d2lkdGgsIGhlaWdodH1cbiAgICAgIGNhbnZhcyA9IENvbnRleHQuY2FudmFzIHx8PSBuZXcgQ2FudmFzIHdpZHRoLCBoZWlnaHQsIE1vZGVcbiAgICAgIGN0eCA9IENvbnRleHQuY3R4ID0gY2FudmFzLmdldENvbnRleHQgJzJkJ1xuICAgICAgY3R4LnRleHREcmF3aW5nTW9kZSA9ICdnbHlwaCcgaWYgTW9kZSA9PSAncGRmJ1xuXG4gICAgY2JcbiAgICAgIHBhZ2VfaGVhZGVyOiAoaGVhZGVyKSAtPiBib29rLmhlYWRlciA9IGhlYWRlclxuICAgICAgcGFnZV9mb290ZXI6IChmb290ZXIpIC0+IGJvb2suZm9vdGVyID0gZm9vdGVyXG4gICAgICB3aXRoUGFnZTogKG9wdGlvbnMsIGRyYXdfcGFnZSkgLT5cbiAgICAgICAgW29wdGlvbnMsIGRyYXdfcGFnZV0gPSBbe30sIG9wdGlvbnNdIGlmIF8uaXNGdW5jdGlvbihvcHRpb25zKVxuICAgICAgICByZXR1cm4gaWYgQGRvbmVcbiAgICAgICAgb3B0aW9ucyA9IF8uZXh0ZW5kIHt9LCBib29rLnBhZ2Vfb3B0aW9ucywgb3B0aW9uc1xuICAgICAgICBwYWdlX2NvdW50ICs9IDFcbiAgICAgICAgaWYgQ3VycmVudFBhZ2VcbiAgICAgICAgICBkcmF3X3BhZ2UgQ3VycmVudFBhZ2VcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHdpdGhQYWdlIG9wdGlvbnMsIGRyYXdfcGFnZVxuICAgICAgICBAZG9uZSA9IHRydWUgaWYgcGFnZV9saW1pdCBhbmQgcGFnZV9saW1pdCA8PSBwYWdlX2NvdW50XG5cbiAgICBpZiBjYW52YXNcbiAgICAgIHdyaXRlX3BkZiBjYW52YXMsIHBhdGguam9pbihCdWlsZERpcmVjdG9yeSwgXCIje2ZpbGVuYW1lfS5wZGZcIilcbiAgICBlbHNlXG4gICAgICBjb25zb2xlLndhcm4gXCJObyBwYWdlc1wiXG4gIGZpbmFsbHlcbiAgICBDdXJyZW50Qm9vayA9IG51bGxcbiAgICBNb2RlID0gbnVsbFxuICAgIGNhbnZhcyA9IG51bGxcbiAgICBjdHggPSBudWxsXG5cbndyaXRlX3BkZiA9IChjYW52YXMsIHBhdGhuYW1lKSAtPlxuICBmcy53cml0ZUZpbGUgcGF0aG5hbWUsIGNhbnZhcy50b0J1ZmZlcigpLCAoZXJyKSAtPlxuICAgIGlmIGVyclxuICAgICAgY29uc29sZS5lcnJvciBcIkVycm9yICN7ZXJyLmNvZGV9IHdyaXRpbmcgdG8gI3tlcnIucGF0aH1cIlxuICAgIGVsc2VcbiAgICAgIGNvbnNvbGUuaW5mbyBcIlNhdmVkICN7cGF0aG5hbWV9XCJcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIFBhcGVyU2l6ZXNcbiAgYWJvdmVcbiAgd2l0aEJvb2tcbiAgd2l0aEdyaWRcbiAgd2l0aEdyaWRCb3hlc1xuXG4gIGRyYXdUZXh0XG4gIGJveFxuICBoYm94XG5cbiAgdGV4dEJveFxuICBsYWJlbGVkXG4gIG1lYXN1cmVfdGV4dFxuICBkaXJlY3RvcnlcbiAgZmlsZW5hbWVcbiAgd2l0aEdyYXBoaWNzQ29udGV4dFxuICB3aXRoQ2FudmFzXG59XG4iLCJ7UEksIGNvcywgc2luLCBtaW4sIG1heH0gPSBNYXRoXG5DaG9yZERpYWdyYW1TdHlsZSA9IHJlcXVpcmUoJy4vY2hvcmRfZGlhZ3JhbScpLmRlZmF1bHRTdHlsZVxue2Jsb2NrLCB3aXRoR3JhcGhpY3NDb250ZXh0fSA9IHJlcXVpcmUgJy4vbGF5b3V0J1xuXG5kcmF3X3BpdGNoX2RpYWdyYW0gPSAoY3R4LCBwaXRjaENsYXNzZXMsIG9wdGlvbnM9e2RyYXc6IHRydWV9KSAtPlxuICB7cGl0Y2hfY29sb3JzLCBwaXRjaF9uYW1lc30gPSBvcHRpb25zXG4gIHBpdGNoX2NvbG9ycyB8fD0gQ2hvcmREaWFncmFtU3R5bGUuaW50ZXJ2YWxfY2xhc3NfY29sb3JzXG4gIHBpdGNoX25hbWVzIHx8PSAnUiBtMiBNMiBtMyBNMyBQNCBUVCBQNSBtNiBNNiBtNyBNNycuc3BsaXQoL1xccy8pXG4gICMgcGl0Y2hfbmFtZXMgPSAnMSAyYiAyIDNiIDMgNCBUIDUgNmIgNiA3YiA3Jy5zcGxpdCgvXFxzLylcbiAgciA9IDEwXG4gIHJfbGFiZWwgPSByICsgN1xuXG4gIHBpdGNoX2NsYXNzX2FuZ2xlID0gKHBpdGNoQ2xhc3MpIC0+XG4gICAgKHBpdGNoQ2xhc3MgLSAzKSAqIDIgKiBQSSAvIDEyXG5cbiAgYm91bmRzID0ge2xlZnQ6IDAsIHRvcDogMCwgcmlnaHQ6IDAsIGJvdHRvbTogMH1cbiAgZXh0ZW5kX2JvdW5kcyA9IChsZWZ0LCB0b3AsIGJvdHRvbSwgcmlnaHQpIC0+XG4gICAgIyByaWdodCA/PSBsZWZ0XG4gICAgIyBib3R0b20gPz0gdG9wXG4gICAgYm91bmRzLmxlZnQgPSBtaW4gYm91bmRzLmxlZnQsIGxlZnRcbiAgICBib3VuZHMudG9wID0gbWluIGJvdW5kcy50b3AsIHRvcFxuICAgIGJvdW5kcy5yaWdodCA9IG1heCBib3VuZHMucmlnaHQsIHJpZ2h0ID8gbGVmdFxuICAgIGJvdW5kcy5ib3R0b20gPSBtYXggYm91bmRzLmJvdHRvbSwgYm90dG9tID8gdG9wXG5cbiAgZm9yIHBpdGNoQ2xhc3MgaW4gcGl0Y2hDbGFzc2VzXG4gICAgYW5nbGUgPSBwaXRjaF9jbGFzc19hbmdsZSBwaXRjaENsYXNzXG4gICAgeCA9IHIgKiBjb3MoYW5nbGUpXG4gICAgeSA9IHIgKiBzaW4oYW5nbGUpXG5cbiAgICBpZiBvcHRpb25zLmRyYXdcbiAgICAgIGN0eC5iZWdpblBhdGgoKVxuICAgICAgY3R4Lm1vdmVUbyAwLCAwXG4gICAgICBjdHgubGluZVRvIHgsIHlcbiAgICAgIGN0eC5zdHJva2UoKVxuICAgIGV4dGVuZF9ib3VuZHMgeCwgeVxuXG4gICAgaWYgb3B0aW9ucy5kcmF3XG4gICAgICBjdHguYmVnaW5QYXRoKClcbiAgICAgIGN0eC5hcmMgeCwgeSwgMiwgMCwgMiAqIFBJLCBmYWxzZVxuICAgICAgY3R4LmZpbGxTdHlsZSA9IHBpdGNoX2NvbG9yc1twaXRjaENsYXNzXSBvciAnYmxhY2snXG4gICAgICBjdHguZmlsbCgpXG5cbiAgY3R4LmZvbnQgPSAnNHB0IFRpbWVzJ1xuICBjdHguZmlsbFN0eWxlID0gJ2JsYWNrJ1xuICBmb3IgY2xhc3NfbmFtZSwgcGl0Y2hDbGFzcyBpbiBwaXRjaF9uYW1lc1xuICAgIGFuZ2xlID0gcGl0Y2hfY2xhc3NfYW5nbGUgcGl0Y2hDbGFzc1xuICAgIG0gPSBjdHgubWVhc3VyZVRleHQgY2xhc3NfbmFtZVxuICAgIHggPSByX2xhYmVsICogY29zKGFuZ2xlKSAtIG0ud2lkdGggLyAyXG4gICAgeSA9IHJfbGFiZWwgKiBzaW4oYW5nbGUpICsgbS5lbUhlaWdodERlc2NlbnRcbiAgICBjdHguZmlsbFRleHQgY2xhc3NfbmFtZSwgeCwgeSBpZiBvcHRpb25zLmRyYXdcbiAgICBib3VuZHMubGVmdCA9IG1pbiBib3VuZHMubGVmdCwgeFxuICAgIGJvdW5kcy5yaWdodCA9IG1heCBib3VuZHMucmlnaHQsIHggKyBtLndpZHRoXG4gICAgYm91bmRzLnRvcCA9IG1pbiBib3VuZHMudG9wLCB5IC0gbS5lbUhlaWdodEFzY2VudFxuICAgIGJvdW5kcy5ib3R0b20gPSBtYXggYm91bmRzLmJvdHRvbSwgeSArIG0uZW1IZWlnaHRBc2NlbnRcblxuICByZXR1cm4gYm91bmRzXG5cbnBpdGNoX2RpYWdyYW1fYmxvY2sgPSAocGl0Y2hDbGFzc2VzLCBzY2FsZT0xKSAtPlxuICBib3VuZHMgPSB3aXRoR3JhcGhpY3NDb250ZXh0IChjdHgpIC0+IGRyYXdfcGl0Y2hfZGlhZ3JhbSBjdHgsIHBpdGNoQ2xhc3NlcywgZHJhdzogZmFsc2UsIG1lYXN1cmU6IHRydWVcbiAgYmxvY2tcbiAgICB3aWR0aDogKGJvdW5kcy5yaWdodCAtIGJvdW5kcy5sZWZ0KSAqIHNjYWxlXG4gICAgaGVpZ2h0OiAoYm91bmRzLmJvdHRvbSAtIGJvdW5kcy50b3ApICogc2NhbGVcbiAgICBkcmF3OiAtPlxuICAgICAgd2l0aEdyYXBoaWNzQ29udGV4dCAoY3R4KSAtPlxuICAgICAgICBjdHguc2NhbGUgc2NhbGUsIHNjYWxlXG4gICAgICAgIGN0eC50cmFuc2xhdGUgLWJvdW5kcy5sZWZ0LCAtYm91bmRzLmJvdHRvbVxuICAgICAgICBkcmF3X3BpdGNoX2RpYWdyYW0gY3R4LCBwaXRjaENsYXNzZXNcblxubW9kdWxlLmV4cG9ydHMgPVxuICBkcmF3OiBkcmF3X3BpdGNoX2RpYWdyYW1cbiAgYmxvY2s6IHBpdGNoX2RpYWdyYW1fYmxvY2tcbiIsIiNcbiMgTm90ZXMgYW5kIFBpdGNoZXNcbiNcblxuU2hhcnBOb3RlTmFtZXMgPSAnQyBDIyBEIEQjIEUgRiBGIyBHIEcjIEEgQSMgQicucmVwbGFjZSgvIy9nLCAnXFx1MjY2RicpLnNwbGl0KC9cXHMvKVxuRmxhdE5vdGVOYW1lcyA9ICdDIERiIEQgRWIgRSBGIEdiIEcgQWIgQSBCYiBCJy5yZXBsYWNlKC9iL2csICdcXHUyNjZEJykuc3BsaXQoL1xccy8pXG5Ob3RlTmFtZXMgPSBTaGFycE5vdGVOYW1lc1xuXG5BY2NpZGVudGFsVmFsdWVzID1cbiAgJyMnOiAxXG4gICfima8nOiAxXG4gICdiJzogLTFcbiAgJ+KZrSc6IC0xXG4gICfwnYSqJzogMlxuICAn8J2Eqyc6IC0yXG5cbkludGVydmFsTmFtZXMgPSBbJ1AxJywgJ20yJywgJ00yJywgJ20zJywgJ00zJywgJ1A0JywgJ1RUJywgJ1A1JywgJ202JywgJ002JywgJ203JywgJ003JywgJ1A4J11cblxuTG9uZ0ludGVydmFsTmFtZXMgPSBbXG4gICdVbmlzb24nLCAnTWlub3IgMm5kJywgJ01ham9yIDJuZCcsICdNaW5vciAzcmQnLCAnTWFqb3IgM3JkJywgJ1BlcmZlY3QgNHRoJyxcbiAgJ1RyaXRvbmUnLCAnUGVyZmVjdCA1dGgnLCAnTWlub3IgNnRoJywgJ01ham9yIDZ0aCcsICdNaW5vciA3dGgnLCAnTWFqb3IgN3RoJywgJ09jdGF2ZSddXG5cbmdldFBpdGNoQ2xhc3NOYW1lID0gKHBpdGNoQ2xhc3MpIC0+XG4gIE5vdGVOYW1lc1tub3JtYWxpemVQaXRjaENsYXNzKHBpdGNoQ2xhc3MpXVxuXG5nZXRQaXRjaE5hbWUgPSAocGl0Y2gpIC0+XG4gIHJldHVybiBwaXRjaCBpZiB0eXBlb2YgcGl0Y2ggPT0gJ3N0cmluZydcbiAgZ2V0UGl0Y2hDbGFzc05hbWUocGl0Y2gpXG5cbiMgVGhlIGludGVydmFsIGNsYXNzIChpbnRlZ2VyIGluIFswLi4uMTJdKSBiZXR3ZWVuIHR3byBwaXRjaCBjbGFzcyBudW1iZXJzXG5pbnRlcnZhbENsYXNzRGlmZmVyZW5jZSA9IChwY2EsIHBjYikgLT5cbiAgbm9ybWFsaXplUGl0Y2hDbGFzcyhwY2IgLSBwY2EpXG5cbm5vcm1hbGl6ZVBpdGNoQ2xhc3MgPSAocGl0Y2hDbGFzcykgLT5cbiAgKChwaXRjaENsYXNzICUgMTIpICsgMTIpICUgMTJcblxucGl0Y2hGcm9tU2NpZW50aWZpY05vdGF0aW9uID0gKG5hbWUpIC0+XG4gIG1hdGNoID0gbmFtZS5tYXRjaCgvXihbQS1HXSkoWyPima9i4pmt8J2EqvCdhKtdKikoXFxkKykkL2kpXG4gIHRocm93IG5ldyBFcnJvcihcIiN7bmFtZX0gaXMgbm90IGluIHNjaWVudGlmaWMgbm90YXRpb25cIikgdW5sZXNzIG1hdGNoXG4gIFtuYXR1cmFsTmFtZSwgYWNjaWRlbnRhbHMsIG9jdGF2ZV0gPSBtYXRjaFsxLi4uXVxuICBwaXRjaCA9IFNoYXJwTm90ZU5hbWVzLmluZGV4T2YobmF0dXJhbE5hbWUudG9VcHBlckNhc2UoKSkgKyAxMiAqICgxICsgTnVtYmVyKG9jdGF2ZSkpXG4gIHBpdGNoICs9IEFjY2lkZW50YWxWYWx1ZXNbY10gZm9yIGMgaW4gYWNjaWRlbnRhbHNcbiAgcmV0dXJuIHBpdGNoXG5cbnBhcnNlUGl0Y2hDbGFzcyA9IChuYW1lKSAtPlxuICBtYXRjaCA9IG5hbWUubWF0Y2goL14oW0EtR10pKFsj4pmvYuKZrfCdhKrwnYSrXSopJC9pKVxuICB0aHJvdyBuZXcgRXJyb3IoXCIje25hbWV9IGlzIG5vdCBhIHBpdGNoIGNsYXNzIG5hbWVcIikgdW5sZXNzIG1hdGNoXG4gIFtuYXR1cmFsTmFtZSwgYWNjaWRlbnRhbHNdID0gbWF0Y2hbMS4uLl1cbiAgcGl0Y2ggPSBTaGFycE5vdGVOYW1lcy5pbmRleE9mKG5hdHVyYWxOYW1lLnRvVXBwZXJDYXNlKCkpXG4gIHBpdGNoICs9IEFjY2lkZW50YWxWYWx1ZXNbY10gZm9yIGMgaW4gYWNjaWRlbnRhbHNcbiAgcmV0dXJuIHBpdGNoXG5cblxuI1xuIyBTY2FsZXNcbiNcblxuY2xhc3MgU2NhbGVcbiAgY29uc3RydWN0b3I6ICh7QG5hbWUsIEBwaXRjaGVzLCBAdG9uaWNOYW1lfSkgLT5cbiAgICBAdG9uaWNQaXRjaCBvcj0gcGFyc2VQaXRjaENsYXNzKEB0b25pY05hbWUpIGlmIEB0b25pY05hbWVcblxuICBhdDogKHRvbmljTmFtZSkgLT5cbiAgICBuZXcgU2NhbGVcbiAgICAgIG5hbWU6IEBuYW1lXG4gICAgICBwaXRjaGVzOiBAcGl0Y2hlc1xuICAgICAgdG9uaWNOYW1lOiB0b25pY05hbWVcblxuICBjaG9yZHM6IChvcHRpb25zPXt9KSAtPlxuICAgIHRocm93IG5ldyBFcnJvcihcIm9ubHkgaW1wbGVtZW50ZWQgZm9yIHNjYWxlcyB3aXRoIHRvbmljc1wiKSB1bmxlc3MgQHRvbmljUGl0Y2g/XG4gICAgbm90ZU5hbWVzID0gU2hhcnBOb3RlTmFtZXNcbiAgICBub3RlTmFtZXMgPSBGbGF0Tm90ZU5hbWVzIGlmIG5vdGVOYW1lcy5pbmRleE9mKEB0b25pY05hbWUpIDwgMCBvciBAdG9uaWNOYW1lID09ICdGJ1xuICAgIGRlZ3JlZXMgPSBbMCwgMiwgNF1cbiAgICBkZWdyZWVzLnB1c2ggNiBpZiBvcHRpb25zLnNldmVudGhzXG4gICAgZm9yIGkgaW4gWzAuLi5AcGl0Y2hlcy5sZW5ndGhdXG4gICAgICBwaXRjaGVzID0gQHBpdGNoZXNbaS4uXS5jb25jYXQoQHBpdGNoZXNbLi4uaV0pXG4gICAgICBwaXRjaGVzID0gKHBpdGNoZXNbZGVncmVlXSBmb3IgZGVncmVlIGluIGRlZ3JlZXMpLm1hcCAobikgPT4gKG4gKyBAdG9uaWNQaXRjaCkgJSAxMlxuICAgICAgQ2hvcmQuZnJvbVBpdGNoZXMocGl0Y2hlcykuZW5oYXJtb25pY2l6ZVRvKG5vdGVOYW1lcylcblxuICBAZmluZDogKHRvbmljTmFtZSkgLT5cbiAgICBzY2FsZU5hbWUgPSAnRGlhdG9uaWMgTWFqb3InXG4gICAgU2NhbGVzW3NjYWxlTmFtZV0uYXQodG9uaWNOYW1lKVxuXG5TY2FsZXMgPSBkbyAtPlxuICBzY2FsZV9zcGVjcyA9IFtcbiAgICAnRGlhdG9uaWMgTWFqb3I6IDAyNDU3OWUnXG4gICAgJ05hdHVyYWwgTWlub3I6IDAyMzU3OHQnXG4gICAgJ01lbG9kaWMgTWlub3I6IDAyMzU3OWUnXG4gICAgJ0hhcm1vbmljIE1pbm9yOiAwMjM1NzhlJ1xuICAgICdQZW50YXRvbmljIE1ham9yOiAwMjQ3OSdcbiAgICAnUGVudGF0b25pYyBNaW5vcjogMDM1N3QnXG4gICAgJ0JsdWVzOiAwMzU2N3QnXG4gICAgJ0ZyZXlnaXNoOiAwMTQ1Nzh0J1xuICAgICdXaG9sZSBUb25lOiAwMjQ2OHQnXG4gICAgIyAnT2N0YXRvbmljJyBpcyB0aGUgY2xhc3NpY2FsIG5hbWUuIEl0J3MgdGhlIGphenogJ0RpbWluaXNoZWQnIHNjYWxlLlxuICAgICdPY3RhdG9uaWM6IDAyMzU2ODllJ1xuICBdXG4gIGZvciBzcGVjIGluIHNjYWxlX3NwZWNzXG4gICAgW25hbWUsIHBpdGNoZXNdID0gc3BlYy5zcGxpdCgvOlxccyovLCAyKVxuICAgIHBpdGNoZXMgPSBwaXRjaGVzLm1hdGNoKC8uL2cpLm1hcCAoYykgLT4geyd0JzoxMCwgJ2UnOjExfVtjXSBvciBOdW1iZXIoYylcbiAgICBuZXcgU2NhbGUge25hbWUsIHBpdGNoZXN9XG5cbmRvIC0+XG4gIFNjYWxlc1tzY2FsZS5uYW1lXSA9IHNjYWxlIGZvciBzY2FsZSBpbiBTY2FsZXNcblxuTW9kZXMgPSBkbyAtPlxuICByb290VG9uZXMgPSBTY2FsZXNbJ0RpYXRvbmljIE1ham9yJ10ucGl0Y2hlc1xuICBtb2RlTmFtZXMgPSAnSW9uaWFuIERvcmlhbiBQaHJ5Z2lhbiBMeWRpYW4gTWl4b2x5ZGlhbiBBZW9saWFuIExvY3JpYW4nLnNwbGl0KC9cXHMvKVxuICBmb3IgZGVsdGEsIGkgaW4gcm9vdFRvbmVzXG4gICAgbmFtZSA9IG1vZGVOYW1lc1tpXVxuICAgIHBpdGNoZXMgPSAoKGQgLSBkZWx0YSArIDEyKSAlIDEyIGZvciBkIGluIHJvb3RUb25lc1tpLi4uXS5jb25jYXQgcm9vdFRvbmVzWy4uLmldKVxuICAgIG5ldyBTY2FsZSB7bmFtZSwgcGl0Y2hlc31cblxuZG8gLT5cbiAgTW9kZXNbbW9kZS5uYW1lXSA9IG1vZGUgZm9yIG1vZGUgaW4gTW9kZXNcblxuIyBJbmRleGVkIGJ5IHNjYWxlIGRlZ3JlZVxuRnVuY3Rpb25zID0gJ1RvbmljIFN1cGVydG9uaWMgTWVkaWFudCBTdWJkb21pbmFudCBEb21pbmFudCBTdWJtZWRpYW50IFN1YnRvbmljIExlYWRpbmcnLnNwbGl0KC9cXHMvKVxuXG5wYXJzZUNob3JkTnVtZXJhbCA9IChuYW1lKSAtPlxuICBjaG9yZCA9IHtcbiAgICBkZWdyZWU6ICdpIGlpIGlpaSBpdiB2IHZpIHZpaScuaW5kZXhPZihuYW1lLm1hdGNoKC9baXYrXS9pKVsxXSkgKyAxXG4gICAgbWFqb3I6IG5hbWUgPT0gbmFtZS50b1VwcGVyQ2FzZSgpXG4gICAgZmxhdDogbmFtZS5tYXRjaCgvXmIvKVxuICAgIGRpbWluaXNoZWQ6IG5hbWUubWF0Y2goL8KwLylcbiAgICBhdWdtZW50ZWQ6IG5hbWUubWF0Y2goL1xcKy8pXG4gIH1cbiAgcmV0dXJuIGNob3JkXG5cbkZ1bmN0aW9uUXVhbGl0aWVzID1cbiAgbWFqb3I6ICdJIGlpIGlpaSBJViBWIHZpIHZpacKwJy5zcGxpdCgvXFxzLykubWFwIHBhcnNlQ2hvcmROdW1lcmFsXG4gIG1pbm9yOiAnaSBpacKwIGJJSUkgaXYgdiBiVkkgYlZJSScuc3BsaXQoL1xccy8pLm1hcCBwYXJzZUNob3JkTnVtZXJhbFxuXG5cbiNcbiMgQ2hvcmRzXG4jXG5cbmNsYXNzIENob3JkXG4gIGNvbnN0cnVjdG9yOiAoe0BuYW1lLCBAZnVsbE5hbWUsIEBhYmJyLCBAYWJicnMsIEBwaXRjaENsYXNzZXMsIEByb290TmFtZSwgQHJvb3RQaXRjaH0pIC0+XG4gICAgQGFiYnJzID89IFtAYWJicl1cbiAgICBAYWJicnMgPSBAYWJicnMuc3BsaXQoL3MvKSBpZiB0eXBlb2YgQGFiYnJzID09ICdzdHJpbmcnXG4gICAgQGFiYnIgPz0gQGFiYnJzWzBdXG4gICAgaWYgQHJvb3RQaXRjaD9cbiAgICAgIEByb290TmFtZSBvcj0gTm90ZU5hbWVzW0Byb290UGl0Y2hdXG4gICAgaWYgQHJvb3ROYW1lP1xuICAgICAgQHJvb3RQaXRjaCA/PSBwYXJzZVBpdGNoQ2xhc3MoQHJvb3ROYW1lKVxuICAgICAgcm9vdGxlc3NBYmJyID0gQGFiYnJcbiAgICAgIHJvb3RsZXNzRnVsbE5hbWUgPSBAZnVsbE5hbWVcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSB0aGlzLCAnbmFtZScsIGdldDogLT4gXCIje0Byb290TmFtZX0je3Jvb3RsZXNzQWJicn1cIlxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5IHRoaXMsICdmdWxsTmFtZScsIGdldDogLT4gXCIje0Byb290TmFtZX0gI3tyb290bGVzc0Z1bGxOYW1lfVwiXG4gICAgZGVncmVlcyA9ICgxICsgMiAqIGkgZm9yIGkgaW4gWzAuLkBwaXRjaENsYXNzZXMubGVuZ3RoXSlcbiAgICBkZWdyZWVzWzFdID0geydTdXMyJzoyLCAnU3VzNCc6NH1bQG5hbWVdIHx8IGRlZ3JlZXNbMV1cbiAgICBkZWdyZWVzWzNdID0gNiBpZiBAbmFtZS5tYXRjaCAvNi9cbiAgICBAY29tcG9uZW50cyA9IGZvciBwYywgcGNpIGluIEBwaXRjaENsYXNzZXNcbiAgICAgIG5hbWUgPSBJbnRlcnZhbE5hbWVzW3BjXVxuICAgICAgZGVncmVlID0gZGVncmVlc1twY2ldXG4gICAgICBpZiBwYyA9PSAwXG4gICAgICAgIG5hbWUgPSAnUidcbiAgICAgIGVsc2UgdW5sZXNzIE51bWJlcihuYW1lLm1hdGNoKC9cXGQrLyk/WzBdKSA9PSBkZWdyZWVcbiAgICAgICAgbmFtZSA9IFwiQSN7ZGVncmVlfVwiIGlmIE51bWJlcihJbnRlcnZhbE5hbWVzW3BjIC0gMV0ubWF0Y2goL1xcZCsvKT9bMF0pID09IGRlZ3JlZVxuICAgICAgICBuYW1lID0gXCJkI3tkZWdyZWV9XCIgaWYgTnVtYmVyKEludGVydmFsTmFtZXNbcGMgKyAxXS5tYXRjaCgvXFxkKy8pP1swXSkgPT0gZGVncmVlXG4gICAgICBuYW1lXG5cbiAgYXQ6IChyb290TmFtZU9yUGl0Y2gpIC0+XG4gICAgW3Jvb3ROYW1lLCByb290UGl0Y2hdID0gc3dpdGNoIHR5cGVvZiByb290TmFtZU9yUGl0Y2hcbiAgICAgIHdoZW4gJ3N0cmluZydcbiAgICAgICAgW3Jvb3ROYW1lT3JQaXRjaCwgbnVsbF1cbiAgICAgIHdoZW4gJ251bWJlcidcbiAgICAgICAgW251bGwsIHJvb3ROYW1lT3JQaXRjaF1cbiAgICAgIGVsc2VcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiI3Jvb3ROYW1lT3JQaXRjaH0gbXVzdCBiZSBhIHBpdGNoIG5hbWUgb3IgbnVtYmVyXCIpXG5cbiAgICBuZXcgQ2hvcmRcbiAgICAgIG5hbWU6IEBuYW1lXG4gICAgICBhYmJyczogQGFiYnJzXG4gICAgICBmdWxsTmFtZTogQGZ1bGxOYW1lXG4gICAgICBwaXRjaENsYXNzZXM6IEBwaXRjaENsYXNzZXNcbiAgICAgIHJvb3ROYW1lOiByb290TmFtZVxuICAgICAgcm9vdFBpdGNoOiByb290UGl0Y2hcblxuICBkZWdyZWVOYW1lOiAoZGVncmVlSW5kZXgpIC0+XG4gICAgQGNvbXBvbmVudHNbZGVncmVlSW5kZXhdXG5cbiAgZW5oYXJtb25pY2l6ZVRvOiAocGl0Y2hOYW1lQXJyYXkpIC0+XG4gICAgZm9yIHBpdGNoTmFtZSwgcGl0Y2hDbGFzcyBpbiBwaXRjaE5hbWVBcnJheVxuICAgICAgQHJvb3ROYW1lID0gcGl0Y2hOYW1lIGlmIEByb290UGl0Y2ggPT0gcGl0Y2hDbGFzc1xuICAgIHJldHVybiB0aGlzXG5cbiAgQGZpbmQ6IChuYW1lKSAtPlxuICAgIG1hdGNoID0gbmFtZS5tYXRjaCgvXihbYS1nQS1HXVsjYuKZr+KZrV0qKSguKikkLylcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCIje25hbWV9IGlzIG5vdCBhIGNob3JkIG5hbWVcIikgdW5sZXNzIG1hdGNoXG4gICAgW25vdGVOYW1lLCBjaG9yZE5hbWVdID0gbWF0Y2hbMS4uLl1cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCIje25hbWV9IGlzIG5vdCBhIGNob3JkIG5hbWVcIikgdW5sZXNzIENob3Jkc1tjaG9yZE5hbWVdXG4gICAgcmV0dXJuIENob3Jkc1tjaG9yZE5hbWVdLmF0KG5vdGVOYW1lKVxuXG4gIEBmcm9tUGl0Y2hlczogKHBpdGNoZXMpIC0+XG4gICAgcm9vdCA9IHBpdGNoZXNbMF1cbiAgICBDaG9yZC5mcm9tUGl0Y2hDbGFzc2VzKHBpdGNoIC0gcm9vdCBmb3IgcGl0Y2ggaW4gcGl0Y2hlcykuYXQocm9vdClcblxuICBAZnJvbVBpdGNoQ2xhc3NlczogKHBpdGNoQ2xhc3NlcykgLT5cbiAgICBwaXRjaENsYXNzZXMgPSAoKG4gKyAxMikgJSAxMiBmb3IgbiBpbiBwaXRjaENsYXNzZXMpLnNvcnQoKGEsIGIpIC0+IGEgPiBiKVxuICAgIGNob3JkID0gQ2hvcmRzW3BpdGNoQ2xhc3Nlc11cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZG4nJ3QgZmluZCBjaG9yZCB3aXRoIHBpdGNoIGNsYXNzZXMgI3twaXRjaENsYXNzZXN9XCIpIHVubGVzcyBjaG9yZFxuICAgIHJldHVybiBjaG9yZFxuXG5cbkNob3JkRGVmaW5pdGlvbnMgPSBbXG4gIHtuYW1lOiAnTWFqb3InLCBhYmJyczogWycnLCAnTSddLCBwaXRjaENsYXNzZXM6ICcwNDcnfSxcbiAge25hbWU6ICdNaW5vcicsIGFiYnI6ICdtJywgcGl0Y2hDbGFzc2VzOiAnMDM3J30sXG4gIHtuYW1lOiAnQXVnbWVudGVkJywgYWJicnM6IFsnKycsICdhdWcnXSwgcGl0Y2hDbGFzc2VzOiAnMDQ4J30sXG4gIHtuYW1lOiAnRGltaW5pc2hlZCcsIGFiYnJzOiBbJ8KwJywgJ2RpbSddLCBwaXRjaENsYXNzZXM6ICcwMzYnfSxcbiAge25hbWU6ICdTdXMyJywgYWJicjogJ3N1czInLCBwaXRjaENsYXNzZXM6ICcwMjcnfSxcbiAge25hbWU6ICdTdXM0JywgYWJicjogJ3N1czQnLCBwaXRjaENsYXNzZXM6ICcwNTcnfSxcbiAge25hbWU6ICdEb21pbmFudCA3dGgnLCBhYmJyczogWyc3JywgJ2RvbTcnXSwgcGl0Y2hDbGFzc2VzOiAnMDQ3dCd9LFxuICB7bmFtZTogJ0F1Z21lbnRlZCA3dGgnLCBhYmJyczogWycrNycsICc3YXVnJ10sIHBpdGNoQ2xhc3NlczogJzA0OHQnfSxcbiAge25hbWU6ICdEaW1pbmlzaGVkIDd0aCcsIGFiYnJzOiBbJ8KwNycsICdkaW03J10sIHBpdGNoQ2xhc3NlczogJzAzNjknfSxcbiAge25hbWU6ICdNYWpvciA3dGgnLCBhYmJyOiAnbWFqNycsIHBpdGNoQ2xhc3NlczogJzA0N2UnfSxcbiAge25hbWU6ICdNaW5vciA3dGgnLCBhYmJyOiAnbWluNycsIHBpdGNoQ2xhc3NlczogJzAzN3QnfSxcbiAge25hbWU6ICdEb21pbmFudCA3YjUnLCBhYmJyOiAnN2I1JywgcGl0Y2hDbGFzc2VzOiAnMDQ2dCd9LFxuICAjIGZvbGxvd2luZyBpcyBhbHNvIGhhbGYtZGltaW5pc2hlZCA3dGhcbiAge25hbWU6ICdNaW5vciA3dGggYjUnLCBhYmJyczogWyfDuCcsICfDmCcsICdtN2I1J10sIHBpdGNoQ2xhc3NlczogJzAzNnQnfSxcbiAge25hbWU6ICdEaW1pbmlzaGVkIE1haiA3dGgnLCBhYmJyOiAnwrBNYWo3JywgcGl0Y2hDbGFzc2VzOiAnMDM2ZSd9LFxuICB7bmFtZTogJ01pbm9yLU1ham9yIDd0aCcsIGFiYnJzOiBbJ21pbi9tYWo3JywgJ21pbihtYWo3KSddLCBwaXRjaENsYXNzZXM6ICcwMzdlJ30sXG4gIHtuYW1lOiAnNnRoJywgYWJicnM6IFsnNicsICdNNicsICdNNicsICdtYWo2J10sIHBpdGNoQ2xhc3NlczogJzA0NzknfSxcbiAge25hbWU6ICdNaW5vciA2dGgnLCBhYmJyczogWydtNicsICdtaW42J10sIHBpdGNoQ2xhc3NlczogJzAzNzknfSxcbl1cblxuIyBDaG9yZHMgaXMgYW4gYXJyYXkgb2YgY2hvcmQgY2xhc3Nlc1xuQ2hvcmRzID0gQ2hvcmREZWZpbml0aW9ucy5tYXAgKHNwZWMpIC0+XG4gIHNwZWMuZnVsbE5hbWUgPSBzcGVjLm5hbWVcbiAgc3BlYy5uYW1lID0gc3BlYy5uYW1lXG4gICAgLnJlcGxhY2UoL01ham9yKD8hJCkvLCAnTWFqJylcbiAgICAucmVwbGFjZSgvTWlub3IoPyEkKS8sICdNaW4nKVxuICAgIC5yZXBsYWNlKCdEb21pbmFudCcsICdEb20nKVxuICAgIC5yZXBsYWNlKCdEaW1pbmlzaGVkJywgJ0RpbScpXG4gIHNwZWMuYWJicnMgb3I9IFtzcGVjLmFiYnJdXG4gIHNwZWMuYWJicnMgPSBzcGVjLmFiYnJzLnNwbGl0KC9zLykgaWYgdHlwZW9mIHNwZWMuYWJicnMgPT0gJ3N0cmluZydcbiAgc3BlYy5hYmJyIG9yPSBzcGVjLmFiYnJzWzBdXG4gIHNwZWMucGl0Y2hDbGFzc2VzID0gc3BlYy5waXRjaENsYXNzZXMubWF0Y2goLy4vZykubWFwIChjKSAtPiB7J3QnOjEwLCAnZSc6MTF9W2NdIG9yIE51bWJlcihjKVxuICBuZXcgQ2hvcmQgc3BlY1xuXG4jIGBDaG9yZHNgIGlzIGFsc28gaW5kZXhlZCBieSBjaG9yZCBuYW1lcyBhbmQgYWJicmV2aWF0aW9ucywgYW5kIGJ5IHBpdGNoIGNsYXNzZXNcbmRvIC0+XG4gIGZvciBjaG9yZCBpbiBDaG9yZHNcbiAgICB7bmFtZSwgZnVsbE5hbWUsIGFiYnJzfSA9IGNob3JkXG4gICAgQ2hvcmRzW2tleV0gPSBjaG9yZCBmb3Iga2V5IGluIFtuYW1lLCBmdWxsTmFtZV0uY29uY2F0KGFiYnJzKVxuICAgIENob3Jkc1tjaG9yZC5waXRjaENsYXNzZXNdID0gY2hvcmRcblxuXG4jXG4jIEV4cG9ydHNcbiNcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIENob3JkXG4gIENob3Jkc1xuICBJbnRlcnZhbE5hbWVzXG4gIExvbmdJbnRlcnZhbE5hbWVzXG4gIE1vZGVzXG4gIE5vdGVOYW1lc1xuICBTY2FsZVxuICBTY2FsZXNcbiAgZ2V0UGl0Y2hDbGFzc05hbWVcbiAgaW50ZXJ2YWxDbGFzc0RpZmZlcmVuY2VcbiAgcGl0Y2hGcm9tU2NpZW50aWZpY05vdGF0aW9uXG59XG4iLCJGdW5jdGlvbjo6ZGVmaW5lIHx8PSAobmFtZSwgZGVzYykgLT5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5IEBwcm90b3R5cGUsIG5hbWUsIGRlc2NcblxuRnVuY3Rpb246OmNhY2hlZF9nZXR0ZXIgfHw9IChuYW1lLCBmbikgLT5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5IEBwcm90b3R5cGUsIG5hbWUsIGdldDogLT5cbiAgICBjYWNoZSA9IEBfZ2V0dGVyX2NhY2hlIHx8PSB7fVxuICAgIHJldHVybiBjYWNoZVtuYW1lXSBpZiBuYW1lIG9mIGNhY2hlXG4gICAgY2FjaGVbbmFtZV0gPSBmbi5jYWxsKHRoaXMpXG5cbmhzdjJyZ2IgPSAoe2gsIHMsIHZ9KSAtPlxuICBoIC89IDM2MFxuICBjID0gdiAqIHNcbiAgeCA9IGMgKiAoMSAtIE1hdGguYWJzKChoICogNikgJSAyIC0gMSkpXG4gIGNvbXBvbmVudHMgPSBzd2l0Y2ggTWF0aC5mbG9vcihoICogNikgJSA2XG4gICAgd2hlbiAwIHRoZW4gW2MsIHgsIDBdXG4gICAgd2hlbiAxIHRoZW4gW3gsIGMsIDBdXG4gICAgd2hlbiAyIHRoZW4gWzAsIGMsIHhdXG4gICAgd2hlbiAzIHRoZW4gWzAsIHgsIGNdXG4gICAgd2hlbiA0IHRoZW4gW3gsIDAsIGNdXG4gICAgd2hlbiA1IHRoZW4gW2MsIDAsIHhdXG4gIFtyLCBnLCBiXSA9IChjb21wb25lbnQgKyB2IC0gYyBmb3IgY29tcG9uZW50IGluIGNvbXBvbmVudHMpXG4gIHtyLCBnLCBifVxuXG5yZ2IyY3NzID0gKHtyLCBnLCBifSkgLT5cbiAgW3IsIGcsIGJdID0gKE1hdGguZmxvb3IoMjU1ICogYykgZm9yIGMgaW4gW3IsIGcsIGJdKVxuICBcInJnYigje3J9LCAje2d9LCAje2J9KVwiXG5cbmhzdjJjc3MgPSAoaHN2KSAtPiByZ2IyY3NzIGhzdjJyZ2IoaHN2KVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgaHN2MmNzc1xuICBoc3YycmdiXG4gIHJnYjJjc3Ncbn1cbiIsInZhciBwcm9jZXNzPXJlcXVpcmUoXCJfX2Jyb3dzZXJpZnlfcHJvY2Vzc1wiKTtpZiAoIXByb2Nlc3MuRXZlbnRFbWl0dGVyKSBwcm9jZXNzLkV2ZW50RW1pdHRlciA9IGZ1bmN0aW9uICgpIHt9O1xuXG52YXIgRXZlbnRFbWl0dGVyID0gZXhwb3J0cy5FdmVudEVtaXR0ZXIgPSBwcm9jZXNzLkV2ZW50RW1pdHRlcjtcbnZhciBpc0FycmF5ID0gdHlwZW9mIEFycmF5LmlzQXJyYXkgPT09ICdmdW5jdGlvbidcbiAgICA/IEFycmF5LmlzQXJyYXlcbiAgICA6IGZ1bmN0aW9uICh4cykge1xuICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHhzKSA9PT0gJ1tvYmplY3QgQXJyYXldJ1xuICAgIH1cbjtcbmZ1bmN0aW9uIGluZGV4T2YgKHhzLCB4KSB7XG4gICAgaWYgKHhzLmluZGV4T2YpIHJldHVybiB4cy5pbmRleE9mKHgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHggPT09IHhzW2ldKSByZXR1cm4gaTtcbiAgICB9XG4gICAgcmV0dXJuIC0xO1xufVxuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuXG4vLyAxMCBsaXN0ZW5lcnMgYXJlIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2hcbi8vIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuLy9cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG52YXIgZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSB7fTtcbiAgdGhpcy5fZXZlbnRzLm1heExpc3RlbmVycyA9IG47XG59O1xuXG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzQXJyYXkodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpXG4gICAge1xuICAgICAgaWYgKGFyZ3VtZW50c1sxXSBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGFyZ3VtZW50c1sxXTsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuY2F1Z2h0LCB1bnNwZWNpZmllZCAnZXJyb3InIGV2ZW50LlwiKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXRoaXMuX2V2ZW50cykgcmV0dXJuIGZhbHNlO1xuICB2YXIgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgaWYgKCFoYW5kbGVyKSByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKHR5cGVvZiBoYW5kbGVyID09ICdmdW5jdGlvbicpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2UgaWYgKGlzQXJyYXkoaGFuZGxlcikpIHtcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgICB2YXIgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2Uge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufTtcblxuLy8gRXZlbnRFbWl0dGVyIGlzIGRlZmluZWQgaW4gc3JjL25vZGVfZXZlbnRzLmNjXG4vLyBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQoKSBpcyBhbHNvIGRlZmluZWQgdGhlcmUuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCdmdW5jdGlvbicgIT09IHR5cGVvZiBsaXN0ZW5lcikge1xuICAgIHRocm93IG5ldyBFcnJvcignYWRkTGlzdGVuZXIgb25seSB0YWtlcyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24nKTtcbiAgfVxuXG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09IFwibmV3TGlzdGVuZXJzXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyc1wiLlxuICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKSB7XG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIH0gZWxzZSBpZiAoaXNBcnJheSh0aGlzLl9ldmVudHNbdHlwZV0pKSB7XG5cbiAgICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICAgIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgICAgdmFyIG07XG4gICAgICBpZiAodGhpcy5fZXZlbnRzLm1heExpc3RlbmVycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG0gPSB0aGlzLl9ldmVudHMubWF4TGlzdGVuZXJzO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbSA9IGRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgICB9XG5cbiAgICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIH0gZWxzZSB7XG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBzZWxmLm9uKHR5cGUsIGZ1bmN0aW9uIGcoKSB7XG4gICAgc2VsZi5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcbiAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9KTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoJ2Z1bmN0aW9uJyAhPT0gdHlwZW9mIGxpc3RlbmVyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdyZW1vdmVMaXN0ZW5lciBvbmx5IHRha2VzIGluc3RhbmNlcyBvZiBGdW5jdGlvbicpO1xuICB9XG5cbiAgLy8gZG9lcyBub3QgdXNlIGxpc3RlbmVycygpLCBzbyBubyBzaWRlIGVmZmVjdCBvZiBjcmVhdGluZyBfZXZlbnRzW3R5cGVdXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pIHJldHVybiB0aGlzO1xuXG4gIHZhciBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0FycmF5KGxpc3QpKSB7XG4gICAgdmFyIGkgPSBpbmRleE9mKGxpc3QsIGxpc3RlbmVyKTtcbiAgICBpZiAoaSA8IDApIHJldHVybiB0aGlzO1xuICAgIGxpc3Quc3BsaWNlKGksIDEpO1xuICAgIGlmIChsaXN0Lmxlbmd0aCA9PSAwKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgfSBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0gPT09IGxpc3RlbmVyKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBkb2VzIG5vdCB1c2UgbGlzdGVuZXJzKCksIHNvIG5vIHNpZGUgZWZmZWN0IG9mIGNyZWF0aW5nIF9ldmVudHNbdHlwZV1cbiAgaWYgKHR5cGUgJiYgdGhpcy5fZXZlbnRzICYmIHRoaXMuX2V2ZW50c1t0eXBlXSkgdGhpcy5fZXZlbnRzW3R5cGVdID0gbnVsbDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgaWYgKCF0aGlzLl9ldmVudHMpIHRoaXMuX2V2ZW50cyA9IHt9O1xuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkgdGhpcy5fZXZlbnRzW3R5cGVdID0gW107XG4gIGlmICghaXNBcnJheSh0aGlzLl9ldmVudHNbdHlwZV0pKSB7XG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIH1cbiAgcmV0dXJuIHRoaXMuX2V2ZW50c1t0eXBlXTtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIWVtaXR0ZXIuX2V2ZW50cyB8fCAhZW1pdHRlci5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IDA7XG4gIGVsc2UgaWYgKHR5cGVvZiBlbWl0dGVyLl9ldmVudHNbdHlwZV0gPT09ICdmdW5jdGlvbicpXG4gICAgcmV0ID0gMTtcbiAgZWxzZVxuICAgIHJldCA9IGVtaXR0ZXIuX2V2ZW50c1t0eXBlXS5sZW5ndGg7XG4gIHJldHVybiByZXQ7XG59O1xuIiwiLy8gbm90aGluZyB0byBzZWUgaGVyZS4uLiBubyBmaWxlIG1ldGhvZHMgZm9yIHRoZSBicm93c2VyXG4iLCJ2YXIgcHJvY2Vzcz1yZXF1aXJlKFwiX19icm93c2VyaWZ5X3Byb2Nlc3NcIik7ZnVuY3Rpb24gZmlsdGVyICh4cywgZm4pIHtcbiAgICB2YXIgcmVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB4cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZm4oeHNbaV0sIGksIHhzKSkgcmVzLnB1c2goeHNbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuXG4vLyByZXNvbHZlcyAuIGFuZCAuLiBlbGVtZW50cyBpbiBhIHBhdGggYXJyYXkgd2l0aCBkaXJlY3RvcnkgbmFtZXMgdGhlcmVcbi8vIG11c3QgYmUgbm8gc2xhc2hlcywgZW1wdHkgZWxlbWVudHMsIG9yIGRldmljZSBuYW1lcyAoYzpcXCkgaW4gdGhlIGFycmF5XG4vLyAoc28gYWxzbyBubyBsZWFkaW5nIGFuZCB0cmFpbGluZyBzbGFzaGVzIC0gaXQgZG9lcyBub3QgZGlzdGluZ3Vpc2hcbi8vIHJlbGF0aXZlIGFuZCBhYnNvbHV0ZSBwYXRocylcbmZ1bmN0aW9uIG5vcm1hbGl6ZUFycmF5KHBhcnRzLCBhbGxvd0Fib3ZlUm9vdCkge1xuICAvLyBpZiB0aGUgcGF0aCB0cmllcyB0byBnbyBhYm92ZSB0aGUgcm9vdCwgYHVwYCBlbmRzIHVwID4gMFxuICB2YXIgdXAgPSAwO1xuICBmb3IgKHZhciBpID0gcGFydHMubGVuZ3RoOyBpID49IDA7IGktLSkge1xuICAgIHZhciBsYXN0ID0gcGFydHNbaV07XG4gICAgaWYgKGxhc3QgPT0gJy4nKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgfSBlbHNlIGlmIChsYXN0ID09PSAnLi4nKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgICB1cCsrO1xuICAgIH0gZWxzZSBpZiAodXApIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIHVwLS07XG4gICAgfVxuICB9XG5cbiAgLy8gaWYgdGhlIHBhdGggaXMgYWxsb3dlZCB0byBnbyBhYm92ZSB0aGUgcm9vdCwgcmVzdG9yZSBsZWFkaW5nIC4uc1xuICBpZiAoYWxsb3dBYm92ZVJvb3QpIHtcbiAgICBmb3IgKDsgdXAtLTsgdXApIHtcbiAgICAgIHBhcnRzLnVuc2hpZnQoJy4uJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBhcnRzO1xufVxuXG4vLyBSZWdleCB0byBzcGxpdCBhIGZpbGVuYW1lIGludG8gWyosIGRpciwgYmFzZW5hbWUsIGV4dF1cbi8vIHBvc2l4IHZlcnNpb25cbnZhciBzcGxpdFBhdGhSZSA9IC9eKC4rXFwvKD8hJCl8XFwvKT8oKD86Lis/KT8oXFwuW14uXSopPykkLztcblxuLy8gcGF0aC5yZXNvbHZlKFtmcm9tIC4uLl0sIHRvKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5yZXNvbHZlID0gZnVuY3Rpb24oKSB7XG52YXIgcmVzb2x2ZWRQYXRoID0gJycsXG4gICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IGZhbHNlO1xuXG5mb3IgKHZhciBpID0gYXJndW1lbnRzLmxlbmd0aDsgaSA+PSAtMSAmJiAhcmVzb2x2ZWRBYnNvbHV0ZTsgaS0tKSB7XG4gIHZhciBwYXRoID0gKGkgPj0gMClcbiAgICAgID8gYXJndW1lbnRzW2ldXG4gICAgICA6IHByb2Nlc3MuY3dkKCk7XG5cbiAgLy8gU2tpcCBlbXB0eSBhbmQgaW52YWxpZCBlbnRyaWVzXG4gIGlmICh0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycgfHwgIXBhdGgpIHtcbiAgICBjb250aW51ZTtcbiAgfVxuXG4gIHJlc29sdmVkUGF0aCA9IHBhdGggKyAnLycgKyByZXNvbHZlZFBhdGg7XG4gIHJlc29sdmVkQWJzb2x1dGUgPSBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nO1xufVxuXG4vLyBBdCB0aGlzIHBvaW50IHRoZSBwYXRoIHNob3VsZCBiZSByZXNvbHZlZCB0byBhIGZ1bGwgYWJzb2x1dGUgcGF0aCwgYnV0XG4vLyBoYW5kbGUgcmVsYXRpdmUgcGF0aHMgdG8gYmUgc2FmZSAobWlnaHQgaGFwcGVuIHdoZW4gcHJvY2Vzcy5jd2QoKSBmYWlscylcblxuLy8gTm9ybWFsaXplIHRoZSBwYXRoXG5yZXNvbHZlZFBhdGggPSBub3JtYWxpemVBcnJheShmaWx0ZXIocmVzb2x2ZWRQYXRoLnNwbGl0KCcvJyksIGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gISFwO1xuICB9KSwgIXJlc29sdmVkQWJzb2x1dGUpLmpvaW4oJy8nKTtcblxuICByZXR1cm4gKChyZXNvbHZlZEFic29sdXRlID8gJy8nIDogJycpICsgcmVzb2x2ZWRQYXRoKSB8fCAnLic7XG59O1xuXG4vLyBwYXRoLm5vcm1hbGl6ZShwYXRoKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5ub3JtYWxpemUgPSBmdW5jdGlvbihwYXRoKSB7XG52YXIgaXNBYnNvbHV0ZSA9IHBhdGguY2hhckF0KDApID09PSAnLycsXG4gICAgdHJhaWxpbmdTbGFzaCA9IHBhdGguc2xpY2UoLTEpID09PSAnLyc7XG5cbi8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxucGF0aCA9IG5vcm1hbGl6ZUFycmF5KGZpbHRlcihwYXRoLnNwbGl0KCcvJyksIGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gISFwO1xuICB9KSwgIWlzQWJzb2x1dGUpLmpvaW4oJy8nKTtcblxuICBpZiAoIXBhdGggJiYgIWlzQWJzb2x1dGUpIHtcbiAgICBwYXRoID0gJy4nO1xuICB9XG4gIGlmIChwYXRoICYmIHRyYWlsaW5nU2xhc2gpIHtcbiAgICBwYXRoICs9ICcvJztcbiAgfVxuICBcbiAgcmV0dXJuIChpc0Fic29sdXRlID8gJy8nIDogJycpICsgcGF0aDtcbn07XG5cblxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5qb2luID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwYXRocyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG4gIHJldHVybiBleHBvcnRzLm5vcm1hbGl6ZShmaWx0ZXIocGF0aHMsIGZ1bmN0aW9uKHAsIGluZGV4KSB7XG4gICAgcmV0dXJuIHAgJiYgdHlwZW9mIHAgPT09ICdzdHJpbmcnO1xuICB9KS5qb2luKCcvJykpO1xufTtcblxuXG5leHBvcnRzLmRpcm5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHZhciBkaXIgPSBzcGxpdFBhdGhSZS5leGVjKHBhdGgpWzFdIHx8ICcnO1xuICB2YXIgaXNXaW5kb3dzID0gZmFsc2U7XG4gIGlmICghZGlyKSB7XG4gICAgLy8gTm8gZGlybmFtZVxuICAgIHJldHVybiAnLic7XG4gIH0gZWxzZSBpZiAoZGlyLmxlbmd0aCA9PT0gMSB8fFxuICAgICAgKGlzV2luZG93cyAmJiBkaXIubGVuZ3RoIDw9IDMgJiYgZGlyLmNoYXJBdCgxKSA9PT0gJzonKSkge1xuICAgIC8vIEl0IGlzIGp1c3QgYSBzbGFzaCBvciBhIGRyaXZlIGxldHRlciB3aXRoIGEgc2xhc2hcbiAgICByZXR1cm4gZGlyO1xuICB9IGVsc2Uge1xuICAgIC8vIEl0IGlzIGEgZnVsbCBkaXJuYW1lLCBzdHJpcCB0cmFpbGluZyBzbGFzaFxuICAgIHJldHVybiBkaXIuc3Vic3RyaW5nKDAsIGRpci5sZW5ndGggLSAxKTtcbiAgfVxufTtcblxuXG5leHBvcnRzLmJhc2VuYW1lID0gZnVuY3Rpb24ocGF0aCwgZXh0KSB7XG4gIHZhciBmID0gc3BsaXRQYXRoUmUuZXhlYyhwYXRoKVsyXSB8fCAnJztcbiAgLy8gVE9ETzogbWFrZSB0aGlzIGNvbXBhcmlzb24gY2FzZS1pbnNlbnNpdGl2ZSBvbiB3aW5kb3dzP1xuICBpZiAoZXh0ICYmIGYuc3Vic3RyKC0xICogZXh0Lmxlbmd0aCkgPT09IGV4dCkge1xuICAgIGYgPSBmLnN1YnN0cigwLCBmLmxlbmd0aCAtIGV4dC5sZW5ndGgpO1xuICB9XG4gIHJldHVybiBmO1xufTtcblxuXG5leHBvcnRzLmV4dG5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHJldHVybiBzcGxpdFBhdGhSZS5leGVjKHBhdGgpWzNdIHx8ICcnO1xufTtcblxuZXhwb3J0cy5yZWxhdGl2ZSA9IGZ1bmN0aW9uKGZyb20sIHRvKSB7XG4gIGZyb20gPSBleHBvcnRzLnJlc29sdmUoZnJvbSkuc3Vic3RyKDEpO1xuICB0byA9IGV4cG9ydHMucmVzb2x2ZSh0bykuc3Vic3RyKDEpO1xuXG4gIGZ1bmN0aW9uIHRyaW0oYXJyKSB7XG4gICAgdmFyIHN0YXJ0ID0gMDtcbiAgICBmb3IgKDsgc3RhcnQgPCBhcnIubGVuZ3RoOyBzdGFydCsrKSB7XG4gICAgICBpZiAoYXJyW3N0YXJ0XSAhPT0gJycpIGJyZWFrO1xuICAgIH1cblxuICAgIHZhciBlbmQgPSBhcnIubGVuZ3RoIC0gMTtcbiAgICBmb3IgKDsgZW5kID49IDA7IGVuZC0tKSB7XG4gICAgICBpZiAoYXJyW2VuZF0gIT09ICcnKSBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoc3RhcnQgPiBlbmQpIHJldHVybiBbXTtcbiAgICByZXR1cm4gYXJyLnNsaWNlKHN0YXJ0LCBlbmQgLSBzdGFydCArIDEpO1xuICB9XG5cbiAgdmFyIGZyb21QYXJ0cyA9IHRyaW0oZnJvbS5zcGxpdCgnLycpKTtcbiAgdmFyIHRvUGFydHMgPSB0cmltKHRvLnNwbGl0KCcvJykpO1xuXG4gIHZhciBsZW5ndGggPSBNYXRoLm1pbihmcm9tUGFydHMubGVuZ3RoLCB0b1BhcnRzLmxlbmd0aCk7XG4gIHZhciBzYW1lUGFydHNMZW5ndGggPSBsZW5ndGg7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoZnJvbVBhcnRzW2ldICE9PSB0b1BhcnRzW2ldKSB7XG4gICAgICBzYW1lUGFydHNMZW5ndGggPSBpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgdmFyIG91dHB1dFBhcnRzID0gW107XG4gIGZvciAodmFyIGkgPSBzYW1lUGFydHNMZW5ndGg7IGkgPCBmcm9tUGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICBvdXRwdXRQYXJ0cy5wdXNoKCcuLicpO1xuICB9XG5cbiAgb3V0cHV0UGFydHMgPSBvdXRwdXRQYXJ0cy5jb25jYXQodG9QYXJ0cy5zbGljZShzYW1lUGFydHNMZW5ndGgpKTtcblxuICByZXR1cm4gb3V0cHV0UGFydHMuam9pbignLycpO1xufTtcblxuZXhwb3J0cy5zZXAgPSAnLyc7XG4iLCJ2YXIgZXZlbnRzID0gcmVxdWlyZSgnZXZlbnRzJyk7XG5cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5leHBvcnRzLmlzRGF0ZSA9IGZ1bmN0aW9uKG9iail7cmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBEYXRlXSd9O1xuZXhwb3J0cy5pc1JlZ0V4cCA9IGZ1bmN0aW9uKG9iail7cmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBSZWdFeHBdJ307XG5cblxuZXhwb3J0cy5wcmludCA9IGZ1bmN0aW9uICgpIHt9O1xuZXhwb3J0cy5wdXRzID0gZnVuY3Rpb24gKCkge307XG5leHBvcnRzLmRlYnVnID0gZnVuY3Rpb24oKSB7fTtcblxuZXhwb3J0cy5pbnNwZWN0ID0gZnVuY3Rpb24ob2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKSB7XG4gIHZhciBzZWVuID0gW107XG5cbiAgdmFyIHN0eWxpemUgPSBmdW5jdGlvbihzdHIsIHN0eWxlVHlwZSkge1xuICAgIC8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuICAgIHZhciBzdHlsZXMgPVxuICAgICAgICB7ICdib2xkJyA6IFsxLCAyMl0sXG4gICAgICAgICAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAgICAgICAgICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgICAgICAgICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAgICAgICAgICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgICAgICAgICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgICAgICAgICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICAgICAgICAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICAgICAgICAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICAgICAgICAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAgICAgICAgICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAgICAgICAgICdyZWQnIDogWzMxLCAzOV0sXG4gICAgICAgICAgJ3llbGxvdycgOiBbMzMsIDM5XSB9O1xuXG4gICAgdmFyIHN0eWxlID1cbiAgICAgICAgeyAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgICAgICAgICAnbnVtYmVyJzogJ2JsdWUnLFxuICAgICAgICAgICdib29sZWFuJzogJ3llbGxvdycsXG4gICAgICAgICAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgICAgICAgICAnbnVsbCc6ICdib2xkJyxcbiAgICAgICAgICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgICAgICAgICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgICAgICAgICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAgICAgICAgICdyZWdleHAnOiAncmVkJyB9W3N0eWxlVHlwZV07XG5cbiAgICBpZiAoc3R5bGUpIHtcbiAgICAgIHJldHVybiAnXFx1MDAxYlsnICsgc3R5bGVzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICAgJ1xcdTAwMWJbJyArIHN0eWxlc1tzdHlsZV1bMV0gKyAnbSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICB9O1xuICBpZiAoISBjb2xvcnMpIHtcbiAgICBzdHlsaXplID0gZnVuY3Rpb24oc3RyLCBzdHlsZVR5cGUpIHsgcmV0dXJuIHN0cjsgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZvcm1hdCh2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gICAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAgIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUuaW5zcGVjdCA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgICAgdmFsdWUgIT09IGV4cG9ydHMgJiZcbiAgICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICAgIHJldHVybiB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuXG4gICAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgICBzd2l0Y2ggKHR5cGVvZiB2YWx1ZSkge1xuICAgICAgY2FzZSAndW5kZWZpbmVkJzpcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcblxuICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG5cbiAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgIHJldHVybiBzdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcblxuICAgICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICAgIHJldHVybiBzdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gICAgfVxuICAgIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBzdHlsaXplKCdudWxsJywgJ251bGwnKTtcbiAgICB9XG5cbiAgICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gICAgdmFyIHZpc2libGVfa2V5cyA9IE9iamVjdF9rZXlzKHZhbHVlKTtcbiAgICB2YXIga2V5cyA9IHNob3dIaWRkZW4gPyBPYmplY3RfZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSkgOiB2aXNpYmxlX2tleXM7XG5cbiAgICAvLyBGdW5jdGlvbnMgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nICYmIGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiBzdHlsaXplKCcnICsgdmFsdWUsICdyZWdleHAnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICAgIHJldHVybiBzdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBEYXRlcyB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkXG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkgJiYga2V5cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBzdHlsaXplKHZhbHVlLnRvVVRDU3RyaW5nKCksICdkYXRlJyk7XG4gICAgfVxuXG4gICAgdmFyIGJhc2UsIHR5cGUsIGJyYWNlcztcbiAgICAvLyBEZXRlcm1pbmUgdGhlIG9iamVjdCB0eXBlXG4gICAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgICB0eXBlID0gJ0FycmF5JztcbiAgICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gICAgfSBlbHNlIHtcbiAgICAgIHR5cGUgPSAnT2JqZWN0JztcbiAgICAgIGJyYWNlcyA9IFsneycsICd9J107XG4gICAgfVxuXG4gICAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIGJhc2UgPSAoaXNSZWdFeHAodmFsdWUpKSA/ICcgJyArIHZhbHVlIDogJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgICB9IGVsc2Uge1xuICAgICAgYmFzZSA9ICcnO1xuICAgIH1cblxuICAgIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICBiYXNlID0gJyAnICsgdmFsdWUudG9VVENTdHJpbmcoKTtcbiAgICB9XG5cbiAgICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICAgIH1cblxuICAgIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiBzdHlsaXplKCcnICsgdmFsdWUsICdyZWdleHAnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBzdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc2Vlbi5wdXNoKHZhbHVlKTtcblxuICAgIHZhciBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHZhciBuYW1lLCBzdHI7XG4gICAgICBpZiAodmFsdWUuX19sb29rdXBHZXR0ZXJfXykge1xuICAgICAgICBpZiAodmFsdWUuX19sb29rdXBHZXR0ZXJfXyhrZXkpKSB7XG4gICAgICAgICAgaWYgKHZhbHVlLl9fbG9va3VwU2V0dGVyX18oa2V5KSkge1xuICAgICAgICAgICAgc3RyID0gc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RyID0gc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAodmFsdWUuX19sb29rdXBTZXR0ZXJfXyhrZXkpKSB7XG4gICAgICAgICAgICBzdHIgPSBzdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAodmlzaWJsZV9rZXlzLmluZGV4T2Yoa2V5KSA8IDApIHtcbiAgICAgICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgICAgIH1cbiAgICAgIGlmICghc3RyKSB7XG4gICAgICAgIGlmIChzZWVuLmluZGV4T2YodmFsdWVba2V5XSkgPCAwKSB7XG4gICAgICAgICAgaWYgKHJlY3Vyc2VUaW1lcyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgc3RyID0gZm9ybWF0KHZhbHVlW2tleV0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdHIgPSBmb3JtYXQodmFsdWVba2V5XSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICAgICAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSBzdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiBuYW1lID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBpZiAodHlwZSA9PT0gJ0FycmF5JyAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICAgICAgcmV0dXJuIHN0cjtcbiAgICAgICAgfVxuICAgICAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgICAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgICAgICBuYW1lID0gc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICAgICAgbmFtZSA9IHN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbiAgICB9KTtcblxuICAgIHNlZW4ucG9wKCk7XG5cbiAgICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICAgIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgICAgbnVtTGluZXNFc3QrKztcbiAgICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICAgIHJldHVybiBwcmV2ICsgY3VyLmxlbmd0aCArIDE7XG4gICAgfSwgMCk7XG5cbiAgICBpZiAobGVuZ3RoID4gNTApIHtcbiAgICAgIG91dHB1dCA9IGJyYWNlc1swXSArXG4gICAgICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgICAgICcgJyArXG4gICAgICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgICAgIGJyYWNlc1sxXTtcblxuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQgPSBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfVxuICByZXR1cm4gZm9ybWF0KG9iaiwgKHR5cGVvZiBkZXB0aCA9PT0gJ3VuZGVmaW5lZCcgPyAyIDogZGVwdGgpKTtcbn07XG5cblxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhcikgfHxcbiAgICAgICAgICh0eXBlb2YgYXIgPT09ICdvYmplY3QnICYmIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcikgPT09ICdbb2JqZWN0IEFycmF5XScpO1xufVxuXG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHR5cGVvZiByZSA9PT0gJ29iamVjdCcgJiYgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5cblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIHR5cGVvZiBkID09PSAnb2JqZWN0JyAmJiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cbmV4cG9ydHMubG9nID0gZnVuY3Rpb24gKG1zZykge307XG5cbmV4cG9ydHMucHVtcCA9IG51bGw7XG5cbnZhciBPYmplY3Rfa2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgICB2YXIgcmVzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikgcmVzLnB1c2goa2V5KTtcbiAgICByZXR1cm4gcmVzO1xufTtcblxudmFyIE9iamVjdF9nZXRPd25Qcm9wZXJ0eU5hbWVzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICAgIHZhciByZXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgIGlmIChPYmplY3QuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIHJlcy5wdXNoKGtleSk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59O1xuXG52YXIgT2JqZWN0X2NyZWF0ZSA9IE9iamVjdC5jcmVhdGUgfHwgZnVuY3Rpb24gKHByb3RvdHlwZSwgcHJvcGVydGllcykge1xuICAgIC8vIGZyb20gZXM1LXNoaW1cbiAgICB2YXIgb2JqZWN0O1xuICAgIGlmIChwcm90b3R5cGUgPT09IG51bGwpIHtcbiAgICAgICAgb2JqZWN0ID0geyAnX19wcm90b19fJyA6IG51bGwgfTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlmICh0eXBlb2YgcHJvdG90eXBlICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICAgICAgICAndHlwZW9mIHByb3RvdHlwZVsnICsgKHR5cGVvZiBwcm90b3R5cGUpICsgJ10gIT0gXFwnb2JqZWN0XFwnJ1xuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgVHlwZSA9IGZ1bmN0aW9uICgpIHt9O1xuICAgICAgICBUeXBlLnByb3RvdHlwZSA9IHByb3RvdHlwZTtcbiAgICAgICAgb2JqZWN0ID0gbmV3IFR5cGUoKTtcbiAgICAgICAgb2JqZWN0Ll9fcHJvdG9fXyA9IHByb3RvdHlwZTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBwcm9wZXJ0aWVzICE9PSAndW5kZWZpbmVkJyAmJiBPYmplY3QuZGVmaW5lUHJvcGVydGllcykge1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhvYmplY3QsIHByb3BlcnRpZXMpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0O1xufTtcblxuZXhwb3J0cy5pbmhlcml0cyA9IGZ1bmN0aW9uKGN0b3IsIHN1cGVyQ3Rvcikge1xuICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvcjtcbiAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3RfY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfVxuICB9KTtcbn07XG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICh0eXBlb2YgZiAhPT0gJ3N0cmluZycpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goZXhwb3J0cy5pbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzogcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKXtcbiAgICBpZiAoeCA9PT0gbnVsbCB8fCB0eXBlb2YgeCAhPT0gJ29iamVjdCcpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgZXhwb3J0cy5pbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbnByb2Nlc3MubmV4dFRpY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBjYW5TZXRJbW1lZGlhdGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gW107XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICBpZiAoZXYuc291cmNlID09PSB3aW5kb3cgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn1cblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuIiwiLy8gICAgIFVuZGVyc2NvcmUuanMgMS40LjRcbi8vICAgICBodHRwOi8vdW5kZXJzY29yZWpzLm9yZ1xuLy8gICAgIChjKSAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIEluYy5cbi8vICAgICBVbmRlcnNjb3JlIG1heSBiZSBmcmVlbHkgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuXG4oZnVuY3Rpb24oKSB7XG5cbiAgLy8gQmFzZWxpbmUgc2V0dXBcbiAgLy8gLS0tLS0tLS0tLS0tLS1cblxuICAvLyBFc3RhYmxpc2ggdGhlIHJvb3Qgb2JqZWN0LCBgd2luZG93YCBpbiB0aGUgYnJvd3Nlciwgb3IgYGdsb2JhbGAgb24gdGhlIHNlcnZlci5cbiAgdmFyIHJvb3QgPSB0aGlzO1xuXG4gIC8vIFNhdmUgdGhlIHByZXZpb3VzIHZhbHVlIG9mIHRoZSBgX2AgdmFyaWFibGUuXG4gIHZhciBwcmV2aW91c1VuZGVyc2NvcmUgPSByb290Ll87XG5cbiAgLy8gRXN0YWJsaXNoIHRoZSBvYmplY3QgdGhhdCBnZXRzIHJldHVybmVkIHRvIGJyZWFrIG91dCBvZiBhIGxvb3AgaXRlcmF0aW9uLlxuICB2YXIgYnJlYWtlciA9IHt9O1xuXG4gIC8vIFNhdmUgYnl0ZXMgaW4gdGhlIG1pbmlmaWVkIChidXQgbm90IGd6aXBwZWQpIHZlcnNpb246XG4gIHZhciBBcnJheVByb3RvID0gQXJyYXkucHJvdG90eXBlLCBPYmpQcm90byA9IE9iamVjdC5wcm90b3R5cGUsIEZ1bmNQcm90byA9IEZ1bmN0aW9uLnByb3RvdHlwZTtcblxuICAvLyBDcmVhdGUgcXVpY2sgcmVmZXJlbmNlIHZhcmlhYmxlcyBmb3Igc3BlZWQgYWNjZXNzIHRvIGNvcmUgcHJvdG90eXBlcy5cbiAgdmFyIHB1c2ggICAgICAgICAgICAgPSBBcnJheVByb3RvLnB1c2gsXG4gICAgICBzbGljZSAgICAgICAgICAgID0gQXJyYXlQcm90by5zbGljZSxcbiAgICAgIGNvbmNhdCAgICAgICAgICAgPSBBcnJheVByb3RvLmNvbmNhdCxcbiAgICAgIHRvU3RyaW5nICAgICAgICAgPSBPYmpQcm90by50b1N0cmluZyxcbiAgICAgIGhhc093blByb3BlcnR5ICAgPSBPYmpQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuICAvLyBBbGwgKipFQ01BU2NyaXB0IDUqKiBuYXRpdmUgZnVuY3Rpb24gaW1wbGVtZW50YXRpb25zIHRoYXQgd2UgaG9wZSB0byB1c2VcbiAgLy8gYXJlIGRlY2xhcmVkIGhlcmUuXG4gIHZhclxuICAgIG5hdGl2ZUZvckVhY2ggICAgICA9IEFycmF5UHJvdG8uZm9yRWFjaCxcbiAgICBuYXRpdmVNYXAgICAgICAgICAgPSBBcnJheVByb3RvLm1hcCxcbiAgICBuYXRpdmVSZWR1Y2UgICAgICAgPSBBcnJheVByb3RvLnJlZHVjZSxcbiAgICBuYXRpdmVSZWR1Y2VSaWdodCAgPSBBcnJheVByb3RvLnJlZHVjZVJpZ2h0LFxuICAgIG5hdGl2ZUZpbHRlciAgICAgICA9IEFycmF5UHJvdG8uZmlsdGVyLFxuICAgIG5hdGl2ZUV2ZXJ5ICAgICAgICA9IEFycmF5UHJvdG8uZXZlcnksXG4gICAgbmF0aXZlU29tZSAgICAgICAgID0gQXJyYXlQcm90by5zb21lLFxuICAgIG5hdGl2ZUluZGV4T2YgICAgICA9IEFycmF5UHJvdG8uaW5kZXhPZixcbiAgICBuYXRpdmVMYXN0SW5kZXhPZiAgPSBBcnJheVByb3RvLmxhc3RJbmRleE9mLFxuICAgIG5hdGl2ZUlzQXJyYXkgICAgICA9IEFycmF5LmlzQXJyYXksXG4gICAgbmF0aXZlS2V5cyAgICAgICAgID0gT2JqZWN0LmtleXMsXG4gICAgbmF0aXZlQmluZCAgICAgICAgID0gRnVuY1Byb3RvLmJpbmQ7XG5cbiAgLy8gQ3JlYXRlIGEgc2FmZSByZWZlcmVuY2UgdG8gdGhlIFVuZGVyc2NvcmUgb2JqZWN0IGZvciB1c2UgYmVsb3cuXG4gIHZhciBfID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiBpbnN0YW5jZW9mIF8pIHJldHVybiBvYmo7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIF8pKSByZXR1cm4gbmV3IF8ob2JqKTtcbiAgICB0aGlzLl93cmFwcGVkID0gb2JqO1xuICB9O1xuXG4gIC8vIEV4cG9ydCB0aGUgVW5kZXJzY29yZSBvYmplY3QgZm9yICoqTm9kZS5qcyoqLCB3aXRoXG4gIC8vIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IGZvciB0aGUgb2xkIGByZXF1aXJlKClgIEFQSS4gSWYgd2UncmUgaW5cbiAgLy8gdGhlIGJyb3dzZXIsIGFkZCBgX2AgYXMgYSBnbG9iYWwgb2JqZWN0IHZpYSBhIHN0cmluZyBpZGVudGlmaWVyLFxuICAvLyBmb3IgQ2xvc3VyZSBDb21waWxlciBcImFkdmFuY2VkXCIgbW9kZS5cbiAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gXztcbiAgICB9XG4gICAgZXhwb3J0cy5fID0gXztcbiAgfSBlbHNlIHtcbiAgICByb290Ll8gPSBfO1xuICB9XG5cbiAgLy8gQ3VycmVudCB2ZXJzaW9uLlxuICBfLlZFUlNJT04gPSAnMS40LjQnO1xuXG4gIC8vIENvbGxlY3Rpb24gRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gVGhlIGNvcm5lcnN0b25lLCBhbiBgZWFjaGAgaW1wbGVtZW50YXRpb24sIGFrYSBgZm9yRWFjaGAuXG4gIC8vIEhhbmRsZXMgb2JqZWN0cyB3aXRoIHRoZSBidWlsdC1pbiBgZm9yRWFjaGAsIGFycmF5cywgYW5kIHJhdyBvYmplY3RzLlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgZm9yRWFjaGAgaWYgYXZhaWxhYmxlLlxuICB2YXIgZWFjaCA9IF8uZWFjaCA9IF8uZm9yRWFjaCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybjtcbiAgICBpZiAobmF0aXZlRm9yRWFjaCAmJiBvYmouZm9yRWFjaCA9PT0gbmF0aXZlRm9yRWFjaCkge1xuICAgICAgb2JqLmZvckVhY2goaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIH0gZWxzZSBpZiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gb2JqLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBpZiAoaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpbaV0sIGksIG9iaikgPT09IGJyZWFrZXIpIHJldHVybjtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgICBpZiAoXy5oYXMob2JqLCBrZXkpKSB7XG4gICAgICAgICAgaWYgKGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgb2JqW2tleV0sIGtleSwgb2JqKSA9PT0gYnJlYWtlcikgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgcmVzdWx0cyBvZiBhcHBseWluZyB0aGUgaXRlcmF0b3IgdG8gZWFjaCBlbGVtZW50LlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgbWFwYCBpZiBhdmFpbGFibGUuXG4gIF8ubWFwID0gXy5jb2xsZWN0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0cztcbiAgICBpZiAobmF0aXZlTWFwICYmIG9iai5tYXAgPT09IG5hdGl2ZU1hcCkgcmV0dXJuIG9iai5tYXAoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIHJlc3VsdHNbcmVzdWx0cy5sZW5ndGhdID0gaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIHZhciByZWR1Y2VFcnJvciA9ICdSZWR1Y2Ugb2YgZW1wdHkgYXJyYXkgd2l0aCBubyBpbml0aWFsIHZhbHVlJztcblxuICAvLyAqKlJlZHVjZSoqIGJ1aWxkcyB1cCBhIHNpbmdsZSByZXN1bHQgZnJvbSBhIGxpc3Qgb2YgdmFsdWVzLCBha2EgYGluamVjdGAsXG4gIC8vIG9yIGBmb2xkbGAuIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGByZWR1Y2VgIGlmIGF2YWlsYWJsZS5cbiAgXy5yZWR1Y2UgPSBfLmZvbGRsID0gXy5pbmplY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBtZW1vLCBjb250ZXh0KSB7XG4gICAgdmFyIGluaXRpYWwgPSBhcmd1bWVudHMubGVuZ3RoID4gMjtcbiAgICBpZiAob2JqID09IG51bGwpIG9iaiA9IFtdO1xuICAgIGlmIChuYXRpdmVSZWR1Y2UgJiYgb2JqLnJlZHVjZSA9PT0gbmF0aXZlUmVkdWNlKSB7XG4gICAgICBpZiAoY29udGV4dCkgaXRlcmF0b3IgPSBfLmJpbmQoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgICAgcmV0dXJuIGluaXRpYWwgPyBvYmoucmVkdWNlKGl0ZXJhdG9yLCBtZW1vKSA6IG9iai5yZWR1Y2UoaXRlcmF0b3IpO1xuICAgIH1cbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpZiAoIWluaXRpYWwpIHtcbiAgICAgICAgbWVtbyA9IHZhbHVlO1xuICAgICAgICBpbml0aWFsID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lbW8gPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG1lbW8sIHZhbHVlLCBpbmRleCwgbGlzdCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKCFpbml0aWFsKSB0aHJvdyBuZXcgVHlwZUVycm9yKHJlZHVjZUVycm9yKTtcbiAgICByZXR1cm4gbWVtbztcbiAgfTtcblxuICAvLyBUaGUgcmlnaHQtYXNzb2NpYXRpdmUgdmVyc2lvbiBvZiByZWR1Y2UsIGFsc28ga25vd24gYXMgYGZvbGRyYC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYHJlZHVjZVJpZ2h0YCBpZiBhdmFpbGFibGUuXG4gIF8ucmVkdWNlUmlnaHQgPSBfLmZvbGRyID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgbWVtbywgY29udGV4dCkge1xuICAgIHZhciBpbml0aWFsID0gYXJndW1lbnRzLmxlbmd0aCA+IDI7XG4gICAgaWYgKG9iaiA9PSBudWxsKSBvYmogPSBbXTtcbiAgICBpZiAobmF0aXZlUmVkdWNlUmlnaHQgJiYgb2JqLnJlZHVjZVJpZ2h0ID09PSBuYXRpdmVSZWR1Y2VSaWdodCkge1xuICAgICAgaWYgKGNvbnRleHQpIGl0ZXJhdG9yID0gXy5iaW5kKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICAgIHJldHVybiBpbml0aWFsID8gb2JqLnJlZHVjZVJpZ2h0KGl0ZXJhdG9yLCBtZW1vKSA6IG9iai5yZWR1Y2VSaWdodChpdGVyYXRvcik7XG4gICAgfVxuICAgIHZhciBsZW5ndGggPSBvYmoubGVuZ3RoO1xuICAgIGlmIChsZW5ndGggIT09ICtsZW5ndGgpIHtcbiAgICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgICBsZW5ndGggPSBrZXlzLmxlbmd0aDtcbiAgICB9XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaW5kZXggPSBrZXlzID8ga2V5c1stLWxlbmd0aF0gOiAtLWxlbmd0aDtcbiAgICAgIGlmICghaW5pdGlhbCkge1xuICAgICAgICBtZW1vID0gb2JqW2luZGV4XTtcbiAgICAgICAgaW5pdGlhbCA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtZW1vID0gaXRlcmF0b3IuY2FsbChjb250ZXh0LCBtZW1vLCBvYmpbaW5kZXhdLCBpbmRleCwgbGlzdCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKCFpbml0aWFsKSB0aHJvdyBuZXcgVHlwZUVycm9yKHJlZHVjZUVycm9yKTtcbiAgICByZXR1cm4gbWVtbztcbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIGZpcnN0IHZhbHVlIHdoaWNoIHBhc3NlcyBhIHRydXRoIHRlc3QuIEFsaWFzZWQgYXMgYGRldGVjdGAuXG4gIF8uZmluZCA9IF8uZGV0ZWN0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIHZhciByZXN1bHQ7XG4gICAgYW55KG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpZiAoaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpKSB7XG4gICAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFJldHVybiBhbGwgdGhlIGVsZW1lbnRzIHRoYXQgcGFzcyBhIHRydXRoIHRlc3QuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBmaWx0ZXJgIGlmIGF2YWlsYWJsZS5cbiAgLy8gQWxpYXNlZCBhcyBgc2VsZWN0YC5cbiAgXy5maWx0ZXIgPSBfLnNlbGVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHJlc3VsdHM7XG4gICAgaWYgKG5hdGl2ZUZpbHRlciAmJiBvYmouZmlsdGVyID09PSBuYXRpdmVGaWx0ZXIpIHJldHVybiBvYmouZmlsdGVyKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpZiAoaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpKSByZXN1bHRzW3Jlc3VsdHMubGVuZ3RoXSA9IHZhbHVlO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIC8vIFJldHVybiBhbGwgdGhlIGVsZW1lbnRzIGZvciB3aGljaCBhIHRydXRoIHRlc3QgZmFpbHMuXG4gIF8ucmVqZWN0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIHJldHVybiBfLmZpbHRlcihvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgcmV0dXJuICFpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCk7XG4gICAgfSwgY29udGV4dCk7XG4gIH07XG5cbiAgLy8gRGV0ZXJtaW5lIHdoZXRoZXIgYWxsIG9mIHRoZSBlbGVtZW50cyBtYXRjaCBhIHRydXRoIHRlc3QuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBldmVyeWAgaWYgYXZhaWxhYmxlLlxuICAvLyBBbGlhc2VkIGFzIGBhbGxgLlxuICBfLmV2ZXJ5ID0gXy5hbGwgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaXRlcmF0b3IgfHwgKGl0ZXJhdG9yID0gXy5pZGVudGl0eSk7XG4gICAgdmFyIHJlc3VsdCA9IHRydWU7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0O1xuICAgIGlmIChuYXRpdmVFdmVyeSAmJiBvYmouZXZlcnkgPT09IG5hdGl2ZUV2ZXJ5KSByZXR1cm4gb2JqLmV2ZXJ5KGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpZiAoIShyZXN1bHQgPSByZXN1bHQgJiYgaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpKSkgcmV0dXJuIGJyZWFrZXI7XG4gICAgfSk7XG4gICAgcmV0dXJuICEhcmVzdWx0O1xuICB9O1xuXG4gIC8vIERldGVybWluZSBpZiBhdCBsZWFzdCBvbmUgZWxlbWVudCBpbiB0aGUgb2JqZWN0IG1hdGNoZXMgYSB0cnV0aCB0ZXN0LlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgc29tZWAgaWYgYXZhaWxhYmxlLlxuICAvLyBBbGlhc2VkIGFzIGBhbnlgLlxuICB2YXIgYW55ID0gXy5zb21lID0gXy5hbnkgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaXRlcmF0b3IgfHwgKGl0ZXJhdG9yID0gXy5pZGVudGl0eSk7XG4gICAgdmFyIHJlc3VsdCA9IGZhbHNlO1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHJlc3VsdDtcbiAgICBpZiAobmF0aXZlU29tZSAmJiBvYmouc29tZSA9PT0gbmF0aXZlU29tZSkgcmV0dXJuIG9iai5zb21lKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpZiAocmVzdWx0IHx8IChyZXN1bHQgPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpKSByZXR1cm4gYnJlYWtlcjtcbiAgICB9KTtcbiAgICByZXR1cm4gISFyZXN1bHQ7XG4gIH07XG5cbiAgLy8gRGV0ZXJtaW5lIGlmIHRoZSBhcnJheSBvciBvYmplY3QgY29udGFpbnMgYSBnaXZlbiB2YWx1ZSAodXNpbmcgYD09PWApLlxuICAvLyBBbGlhc2VkIGFzIGBpbmNsdWRlYC5cbiAgXy5jb250YWlucyA9IF8uaW5jbHVkZSA9IGZ1bmN0aW9uKG9iaiwgdGFyZ2V0KSB7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKG5hdGl2ZUluZGV4T2YgJiYgb2JqLmluZGV4T2YgPT09IG5hdGl2ZUluZGV4T2YpIHJldHVybiBvYmouaW5kZXhPZih0YXJnZXQpICE9IC0xO1xuICAgIHJldHVybiBhbnkob2JqLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlID09PSB0YXJnZXQ7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gSW52b2tlIGEgbWV0aG9kICh3aXRoIGFyZ3VtZW50cykgb24gZXZlcnkgaXRlbSBpbiBhIGNvbGxlY3Rpb24uXG4gIF8uaW52b2tlID0gZnVuY3Rpb24ob2JqLCBtZXRob2QpIHtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICB2YXIgaXNGdW5jID0gXy5pc0Z1bmN0aW9uKG1ldGhvZCk7XG4gICAgcmV0dXJuIF8ubWFwKG9iaiwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiAoaXNGdW5jID8gbWV0aG9kIDogdmFsdWVbbWV0aG9kXSkuYXBwbHkodmFsdWUsIGFyZ3MpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIENvbnZlbmllbmNlIHZlcnNpb24gb2YgYSBjb21tb24gdXNlIGNhc2Ugb2YgYG1hcGA6IGZldGNoaW5nIGEgcHJvcGVydHkuXG4gIF8ucGx1Y2sgPSBmdW5jdGlvbihvYmosIGtleSkge1xuICAgIHJldHVybiBfLm1hcChvYmosIGZ1bmN0aW9uKHZhbHVlKXsgcmV0dXJuIHZhbHVlW2tleV07IH0pO1xuICB9O1xuXG4gIC8vIENvbnZlbmllbmNlIHZlcnNpb24gb2YgYSBjb21tb24gdXNlIGNhc2Ugb2YgYGZpbHRlcmA6IHNlbGVjdGluZyBvbmx5IG9iamVjdHNcbiAgLy8gY29udGFpbmluZyBzcGVjaWZpYyBga2V5OnZhbHVlYCBwYWlycy5cbiAgXy53aGVyZSA9IGZ1bmN0aW9uKG9iaiwgYXR0cnMsIGZpcnN0KSB7XG4gICAgaWYgKF8uaXNFbXB0eShhdHRycykpIHJldHVybiBmaXJzdCA/IG51bGwgOiBbXTtcbiAgICByZXR1cm4gX1tmaXJzdCA/ICdmaW5kJyA6ICdmaWx0ZXInXShvYmosIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gYXR0cnMpIHtcbiAgICAgICAgaWYgKGF0dHJzW2tleV0gIT09IHZhbHVlW2tleV0pIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIENvbnZlbmllbmNlIHZlcnNpb24gb2YgYSBjb21tb24gdXNlIGNhc2Ugb2YgYGZpbmRgOiBnZXR0aW5nIHRoZSBmaXJzdCBvYmplY3RcbiAgLy8gY29udGFpbmluZyBzcGVjaWZpYyBga2V5OnZhbHVlYCBwYWlycy5cbiAgXy5maW5kV2hlcmUgPSBmdW5jdGlvbihvYmosIGF0dHJzKSB7XG4gICAgcmV0dXJuIF8ud2hlcmUob2JqLCBhdHRycywgdHJ1ZSk7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBtYXhpbXVtIGVsZW1lbnQgb3IgKGVsZW1lbnQtYmFzZWQgY29tcHV0YXRpb24pLlxuICAvLyBDYW4ndCBvcHRpbWl6ZSBhcnJheXMgb2YgaW50ZWdlcnMgbG9uZ2VyIHRoYW4gNjUsNTM1IGVsZW1lbnRzLlxuICAvLyBTZWU6IGh0dHBzOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD04MDc5N1xuICBfLm1heCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAoIWl0ZXJhdG9yICYmIF8uaXNBcnJheShvYmopICYmIG9ialswXSA9PT0gK29ialswXSAmJiBvYmoubGVuZ3RoIDwgNjU1MzUpIHtcbiAgICAgIHJldHVybiBNYXRoLm1heC5hcHBseShNYXRoLCBvYmopO1xuICAgIH1cbiAgICBpZiAoIWl0ZXJhdG9yICYmIF8uaXNFbXB0eShvYmopKSByZXR1cm4gLUluZmluaXR5O1xuICAgIHZhciByZXN1bHQgPSB7Y29tcHV0ZWQgOiAtSW5maW5pdHksIHZhbHVlOiAtSW5maW5pdHl9O1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIHZhciBjb21wdXRlZCA9IGl0ZXJhdG9yID8gaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpIDogdmFsdWU7XG4gICAgICBjb21wdXRlZCA+PSByZXN1bHQuY29tcHV0ZWQgJiYgKHJlc3VsdCA9IHt2YWx1ZSA6IHZhbHVlLCBjb21wdXRlZCA6IGNvbXB1dGVkfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdC52YWx1ZTtcbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIG1pbmltdW0gZWxlbWVudCAob3IgZWxlbWVudC1iYXNlZCBjb21wdXRhdGlvbikuXG4gIF8ubWluID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmICghaXRlcmF0b3IgJiYgXy5pc0FycmF5KG9iaikgJiYgb2JqWzBdID09PSArb2JqWzBdICYmIG9iai5sZW5ndGggPCA2NTUzNSkge1xuICAgICAgcmV0dXJuIE1hdGgubWluLmFwcGx5KE1hdGgsIG9iaik7XG4gICAgfVxuICAgIGlmICghaXRlcmF0b3IgJiYgXy5pc0VtcHR5KG9iaikpIHJldHVybiBJbmZpbml0eTtcbiAgICB2YXIgcmVzdWx0ID0ge2NvbXB1dGVkIDogSW5maW5pdHksIHZhbHVlOiBJbmZpbml0eX07XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgdmFyIGNvbXB1dGVkID0gaXRlcmF0b3IgPyBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkgOiB2YWx1ZTtcbiAgICAgIGNvbXB1dGVkIDwgcmVzdWx0LmNvbXB1dGVkICYmIChyZXN1bHQgPSB7dmFsdWUgOiB2YWx1ZSwgY29tcHV0ZWQgOiBjb21wdXRlZH0pO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQudmFsdWU7XG4gIH07XG5cbiAgLy8gU2h1ZmZsZSBhbiBhcnJheS5cbiAgXy5zaHVmZmxlID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHJhbmQ7XG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICB2YXIgc2h1ZmZsZWQgPSBbXTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJhbmQgPSBfLnJhbmRvbShpbmRleCsrKTtcbiAgICAgIHNodWZmbGVkW2luZGV4IC0gMV0gPSBzaHVmZmxlZFtyYW5kXTtcbiAgICAgIHNodWZmbGVkW3JhbmRdID0gdmFsdWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIHNodWZmbGVkO1xuICB9O1xuXG4gIC8vIEFuIGludGVybmFsIGZ1bmN0aW9uIHRvIGdlbmVyYXRlIGxvb2t1cCBpdGVyYXRvcnMuXG4gIHZhciBsb29rdXBJdGVyYXRvciA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIF8uaXNGdW5jdGlvbih2YWx1ZSkgPyB2YWx1ZSA6IGZ1bmN0aW9uKG9iail7IHJldHVybiBvYmpbdmFsdWVdOyB9O1xuICB9O1xuXG4gIC8vIFNvcnQgdGhlIG9iamVjdCdzIHZhbHVlcyBieSBhIGNyaXRlcmlvbiBwcm9kdWNlZCBieSBhbiBpdGVyYXRvci5cbiAgXy5zb3J0QnkgPSBmdW5jdGlvbihvYmosIHZhbHVlLCBjb250ZXh0KSB7XG4gICAgdmFyIGl0ZXJhdG9yID0gbG9va3VwSXRlcmF0b3IodmFsdWUpO1xuICAgIHJldHVybiBfLnBsdWNrKF8ubWFwKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB2YWx1ZSA6IHZhbHVlLFxuICAgICAgICBpbmRleCA6IGluZGV4LFxuICAgICAgICBjcml0ZXJpYSA6IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KVxuICAgICAgfTtcbiAgICB9KS5zb3J0KGZ1bmN0aW9uKGxlZnQsIHJpZ2h0KSB7XG4gICAgICB2YXIgYSA9IGxlZnQuY3JpdGVyaWE7XG4gICAgICB2YXIgYiA9IHJpZ2h0LmNyaXRlcmlhO1xuICAgICAgaWYgKGEgIT09IGIpIHtcbiAgICAgICAgaWYgKGEgPiBiIHx8IGEgPT09IHZvaWQgMCkgcmV0dXJuIDE7XG4gICAgICAgIGlmIChhIDwgYiB8fCBiID09PSB2b2lkIDApIHJldHVybiAtMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBsZWZ0LmluZGV4IDwgcmlnaHQuaW5kZXggPyAtMSA6IDE7XG4gICAgfSksICd2YWx1ZScpO1xuICB9O1xuXG4gIC8vIEFuIGludGVybmFsIGZ1bmN0aW9uIHVzZWQgZm9yIGFnZ3JlZ2F0ZSBcImdyb3VwIGJ5XCIgb3BlcmF0aW9ucy5cbiAgdmFyIGdyb3VwID0gZnVuY3Rpb24ob2JqLCB2YWx1ZSwgY29udGV4dCwgYmVoYXZpb3IpIHtcbiAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgdmFyIGl0ZXJhdG9yID0gbG9va3VwSXRlcmF0b3IodmFsdWUgfHwgXy5pZGVudGl0eSk7XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCkge1xuICAgICAgdmFyIGtleSA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBvYmopO1xuICAgICAgYmVoYXZpb3IocmVzdWx0LCBrZXksIHZhbHVlKTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIEdyb3VwcyB0aGUgb2JqZWN0J3MgdmFsdWVzIGJ5IGEgY3JpdGVyaW9uLiBQYXNzIGVpdGhlciBhIHN0cmluZyBhdHRyaWJ1dGVcbiAgLy8gdG8gZ3JvdXAgYnksIG9yIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZSBjcml0ZXJpb24uXG4gIF8uZ3JvdXBCeSA9IGZ1bmN0aW9uKG9iaiwgdmFsdWUsIGNvbnRleHQpIHtcbiAgICByZXR1cm4gZ3JvdXAob2JqLCB2YWx1ZSwgY29udGV4dCwgZnVuY3Rpb24ocmVzdWx0LCBrZXksIHZhbHVlKSB7XG4gICAgICAoXy5oYXMocmVzdWx0LCBrZXkpID8gcmVzdWx0W2tleV0gOiAocmVzdWx0W2tleV0gPSBbXSkpLnB1c2godmFsdWUpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIENvdW50cyBpbnN0YW5jZXMgb2YgYW4gb2JqZWN0IHRoYXQgZ3JvdXAgYnkgYSBjZXJ0YWluIGNyaXRlcmlvbi4gUGFzc1xuICAvLyBlaXRoZXIgYSBzdHJpbmcgYXR0cmlidXRlIHRvIGNvdW50IGJ5LCBvciBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0aGVcbiAgLy8gY3JpdGVyaW9uLlxuICBfLmNvdW50QnkgPSBmdW5jdGlvbihvYmosIHZhbHVlLCBjb250ZXh0KSB7XG4gICAgcmV0dXJuIGdyb3VwKG9iaiwgdmFsdWUsIGNvbnRleHQsIGZ1bmN0aW9uKHJlc3VsdCwga2V5KSB7XG4gICAgICBpZiAoIV8uaGFzKHJlc3VsdCwga2V5KSkgcmVzdWx0W2tleV0gPSAwO1xuICAgICAgcmVzdWx0W2tleV0rKztcbiAgICB9KTtcbiAgfTtcblxuICAvLyBVc2UgYSBjb21wYXJhdG9yIGZ1bmN0aW9uIHRvIGZpZ3VyZSBvdXQgdGhlIHNtYWxsZXN0IGluZGV4IGF0IHdoaWNoXG4gIC8vIGFuIG9iamVjdCBzaG91bGQgYmUgaW5zZXJ0ZWQgc28gYXMgdG8gbWFpbnRhaW4gb3JkZXIuIFVzZXMgYmluYXJ5IHNlYXJjaC5cbiAgXy5zb3J0ZWRJbmRleCA9IGZ1bmN0aW9uKGFycmF5LCBvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaXRlcmF0b3IgPSBpdGVyYXRvciA9PSBudWxsID8gXy5pZGVudGl0eSA6IGxvb2t1cEl0ZXJhdG9yKGl0ZXJhdG9yKTtcbiAgICB2YXIgdmFsdWUgPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9iaik7XG4gICAgdmFyIGxvdyA9IDAsIGhpZ2ggPSBhcnJheS5sZW5ndGg7XG4gICAgd2hpbGUgKGxvdyA8IGhpZ2gpIHtcbiAgICAgIHZhciBtaWQgPSAobG93ICsgaGlnaCkgPj4+IDE7XG4gICAgICBpdGVyYXRvci5jYWxsKGNvbnRleHQsIGFycmF5W21pZF0pIDwgdmFsdWUgPyBsb3cgPSBtaWQgKyAxIDogaGlnaCA9IG1pZDtcbiAgICB9XG4gICAgcmV0dXJuIGxvdztcbiAgfTtcblxuICAvLyBTYWZlbHkgY29udmVydCBhbnl0aGluZyBpdGVyYWJsZSBpbnRvIGEgcmVhbCwgbGl2ZSBhcnJheS5cbiAgXy50b0FycmF5ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKCFvYmopIHJldHVybiBbXTtcbiAgICBpZiAoXy5pc0FycmF5KG9iaikpIHJldHVybiBzbGljZS5jYWxsKG9iaik7XG4gICAgaWYgKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSByZXR1cm4gXy5tYXAob2JqLCBfLmlkZW50aXR5KTtcbiAgICByZXR1cm4gXy52YWx1ZXMob2JqKTtcbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIG51bWJlciBvZiBlbGVtZW50cyBpbiBhbiBvYmplY3QuXG4gIF8uc2l6ZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIDA7XG4gICAgcmV0dXJuIChvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkgPyBvYmoubGVuZ3RoIDogXy5rZXlzKG9iaikubGVuZ3RoO1xuICB9O1xuXG4gIC8vIEFycmF5IEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS1cblxuICAvLyBHZXQgdGhlIGZpcnN0IGVsZW1lbnQgb2YgYW4gYXJyYXkuIFBhc3NpbmcgKipuKiogd2lsbCByZXR1cm4gdGhlIGZpcnN0IE5cbiAgLy8gdmFsdWVzIGluIHRoZSBhcnJheS4gQWxpYXNlZCBhcyBgaGVhZGAgYW5kIGB0YWtlYC4gVGhlICoqZ3VhcmQqKiBjaGVja1xuICAvLyBhbGxvd3MgaXQgdG8gd29yayB3aXRoIGBfLm1hcGAuXG4gIF8uZmlyc3QgPSBfLmhlYWQgPSBfLnRha2UgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIHZvaWQgMDtcbiAgICByZXR1cm4gKG4gIT0gbnVsbCkgJiYgIWd1YXJkID8gc2xpY2UuY2FsbChhcnJheSwgMCwgbikgOiBhcnJheVswXTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGV2ZXJ5dGhpbmcgYnV0IHRoZSBsYXN0IGVudHJ5IG9mIHRoZSBhcnJheS4gRXNwZWNpYWxseSB1c2VmdWwgb25cbiAgLy8gdGhlIGFyZ3VtZW50cyBvYmplY3QuIFBhc3NpbmcgKipuKiogd2lsbCByZXR1cm4gYWxsIHRoZSB2YWx1ZXMgaW5cbiAgLy8gdGhlIGFycmF5LCBleGNsdWRpbmcgdGhlIGxhc3QgTi4gVGhlICoqZ3VhcmQqKiBjaGVjayBhbGxvd3MgaXQgdG8gd29yayB3aXRoXG4gIC8vIGBfLm1hcGAuXG4gIF8uaW5pdGlhbCA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIHJldHVybiBzbGljZS5jYWxsKGFycmF5LCAwLCBhcnJheS5sZW5ndGggLSAoKG4gPT0gbnVsbCkgfHwgZ3VhcmQgPyAxIDogbikpO1xuICB9O1xuXG4gIC8vIEdldCB0aGUgbGFzdCBlbGVtZW50IG9mIGFuIGFycmF5LiBQYXNzaW5nICoqbioqIHdpbGwgcmV0dXJuIHRoZSBsYXN0IE5cbiAgLy8gdmFsdWVzIGluIHRoZSBhcnJheS4gVGhlICoqZ3VhcmQqKiBjaGVjayBhbGxvd3MgaXQgdG8gd29yayB3aXRoIGBfLm1hcGAuXG4gIF8ubGFzdCA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gdm9pZCAwO1xuICAgIGlmICgobiAhPSBudWxsKSAmJiAhZ3VhcmQpIHtcbiAgICAgIHJldHVybiBzbGljZS5jYWxsKGFycmF5LCBNYXRoLm1heChhcnJheS5sZW5ndGggLSBuLCAwKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBhcnJheVthcnJheS5sZW5ndGggLSAxXTtcbiAgICB9XG4gIH07XG5cbiAgLy8gUmV0dXJucyBldmVyeXRoaW5nIGJ1dCB0aGUgZmlyc3QgZW50cnkgb2YgdGhlIGFycmF5LiBBbGlhc2VkIGFzIGB0YWlsYCBhbmQgYGRyb3BgLlxuICAvLyBFc3BlY2lhbGx5IHVzZWZ1bCBvbiB0aGUgYXJndW1lbnRzIG9iamVjdC4gUGFzc2luZyBhbiAqKm4qKiB3aWxsIHJldHVyblxuICAvLyB0aGUgcmVzdCBOIHZhbHVlcyBpbiB0aGUgYXJyYXkuIFRoZSAqKmd1YXJkKipcbiAgLy8gY2hlY2sgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aCBgXy5tYXBgLlxuICBfLnJlc3QgPSBfLnRhaWwgPSBfLmRyb3AgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgKG4gPT0gbnVsbCkgfHwgZ3VhcmQgPyAxIDogbik7XG4gIH07XG5cbiAgLy8gVHJpbSBvdXQgYWxsIGZhbHN5IHZhbHVlcyBmcm9tIGFuIGFycmF5LlxuICBfLmNvbXBhY3QgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHJldHVybiBfLmZpbHRlcihhcnJheSwgXy5pZGVudGl0eSk7XG4gIH07XG5cbiAgLy8gSW50ZXJuYWwgaW1wbGVtZW50YXRpb24gb2YgYSByZWN1cnNpdmUgYGZsYXR0ZW5gIGZ1bmN0aW9uLlxuICB2YXIgZmxhdHRlbiA9IGZ1bmN0aW9uKGlucHV0LCBzaGFsbG93LCBvdXRwdXQpIHtcbiAgICBlYWNoKGlucHV0LCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgaWYgKF8uaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgc2hhbGxvdyA/IHB1c2guYXBwbHkob3V0cHV0LCB2YWx1ZSkgOiBmbGF0dGVuKHZhbHVlLCBzaGFsbG93LCBvdXRwdXQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3V0cHV0LnB1c2godmFsdWUpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBvdXRwdXQ7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgY29tcGxldGVseSBmbGF0dGVuZWQgdmVyc2lvbiBvZiBhbiBhcnJheS5cbiAgXy5mbGF0dGVuID0gZnVuY3Rpb24oYXJyYXksIHNoYWxsb3cpIHtcbiAgICByZXR1cm4gZmxhdHRlbihhcnJheSwgc2hhbGxvdywgW10pO1xuICB9O1xuXG4gIC8vIFJldHVybiBhIHZlcnNpb24gb2YgdGhlIGFycmF5IHRoYXQgZG9lcyBub3QgY29udGFpbiB0aGUgc3BlY2lmaWVkIHZhbHVlKHMpLlxuICBfLndpdGhvdXQgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHJldHVybiBfLmRpZmZlcmVuY2UoYXJyYXksIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gIH07XG5cbiAgLy8gUHJvZHVjZSBhIGR1cGxpY2F0ZS1mcmVlIHZlcnNpb24gb2YgdGhlIGFycmF5LiBJZiB0aGUgYXJyYXkgaGFzIGFscmVhZHlcbiAgLy8gYmVlbiBzb3J0ZWQsIHlvdSBoYXZlIHRoZSBvcHRpb24gb2YgdXNpbmcgYSBmYXN0ZXIgYWxnb3JpdGhtLlxuICAvLyBBbGlhc2VkIGFzIGB1bmlxdWVgLlxuICBfLnVuaXEgPSBfLnVuaXF1ZSA9IGZ1bmN0aW9uKGFycmF5LCBpc1NvcnRlZCwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAoXy5pc0Z1bmN0aW9uKGlzU29ydGVkKSkge1xuICAgICAgY29udGV4dCA9IGl0ZXJhdG9yO1xuICAgICAgaXRlcmF0b3IgPSBpc1NvcnRlZDtcbiAgICAgIGlzU29ydGVkID0gZmFsc2U7XG4gICAgfVxuICAgIHZhciBpbml0aWFsID0gaXRlcmF0b3IgPyBfLm1hcChhcnJheSwgaXRlcmF0b3IsIGNvbnRleHQpIDogYXJyYXk7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICB2YXIgc2VlbiA9IFtdO1xuICAgIGVhY2goaW5pdGlhbCwgZnVuY3Rpb24odmFsdWUsIGluZGV4KSB7XG4gICAgICBpZiAoaXNTb3J0ZWQgPyAoIWluZGV4IHx8IHNlZW5bc2Vlbi5sZW5ndGggLSAxXSAhPT0gdmFsdWUpIDogIV8uY29udGFpbnMoc2VlbiwgdmFsdWUpKSB7XG4gICAgICAgIHNlZW4ucHVzaCh2YWx1ZSk7XG4gICAgICAgIHJlc3VsdHMucHVzaChhcnJheVtpbmRleF0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIC8vIFByb2R1Y2UgYW4gYXJyYXkgdGhhdCBjb250YWlucyB0aGUgdW5pb246IGVhY2ggZGlzdGluY3QgZWxlbWVudCBmcm9tIGFsbCBvZlxuICAvLyB0aGUgcGFzc2VkLWluIGFycmF5cy5cbiAgXy51bmlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBfLnVuaXEoY29uY2F0LmFwcGx5KEFycmF5UHJvdG8sIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIC8vIFByb2R1Y2UgYW4gYXJyYXkgdGhhdCBjb250YWlucyBldmVyeSBpdGVtIHNoYXJlZCBiZXR3ZWVuIGFsbCB0aGVcbiAgLy8gcGFzc2VkLWluIGFycmF5cy5cbiAgXy5pbnRlcnNlY3Rpb24gPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHZhciByZXN0ID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBfLmZpbHRlcihfLnVuaXEoYXJyYXkpLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICByZXR1cm4gXy5ldmVyeShyZXN0LCBmdW5jdGlvbihvdGhlcikge1xuICAgICAgICByZXR1cm4gXy5pbmRleE9mKG90aGVyLCBpdGVtKSA+PSAwO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gVGFrZSB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIG9uZSBhcnJheSBhbmQgYSBudW1iZXIgb2Ygb3RoZXIgYXJyYXlzLlxuICAvLyBPbmx5IHRoZSBlbGVtZW50cyBwcmVzZW50IGluIGp1c3QgdGhlIGZpcnN0IGFycmF5IHdpbGwgcmVtYWluLlxuICBfLmRpZmZlcmVuY2UgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHZhciByZXN0ID0gY29uY2F0LmFwcGx5KEFycmF5UHJvdG8sIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgcmV0dXJuIF8uZmlsdGVyKGFycmF5LCBmdW5jdGlvbih2YWx1ZSl7IHJldHVybiAhXy5jb250YWlucyhyZXN0LCB2YWx1ZSk7IH0pO1xuICB9O1xuXG4gIC8vIFppcCB0b2dldGhlciBtdWx0aXBsZSBsaXN0cyBpbnRvIGEgc2luZ2xlIGFycmF5IC0tIGVsZW1lbnRzIHRoYXQgc2hhcmVcbiAgLy8gYW4gaW5kZXggZ28gdG9nZXRoZXIuXG4gIF8uemlwID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgdmFyIGxlbmd0aCA9IF8ubWF4KF8ucGx1Y2soYXJncywgJ2xlbmd0aCcpKTtcbiAgICB2YXIgcmVzdWx0cyA9IG5ldyBBcnJheShsZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlc3VsdHNbaV0gPSBfLnBsdWNrKGFyZ3MsIFwiXCIgKyBpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gQ29udmVydHMgbGlzdHMgaW50byBvYmplY3RzLiBQYXNzIGVpdGhlciBhIHNpbmdsZSBhcnJheSBvZiBgW2tleSwgdmFsdWVdYFxuICAvLyBwYWlycywgb3IgdHdvIHBhcmFsbGVsIGFycmF5cyBvZiB0aGUgc2FtZSBsZW5ndGggLS0gb25lIG9mIGtleXMsIGFuZCBvbmUgb2ZcbiAgLy8gdGhlIGNvcnJlc3BvbmRpbmcgdmFsdWVzLlxuICBfLm9iamVjdCA9IGZ1bmN0aW9uKGxpc3QsIHZhbHVlcykge1xuICAgIGlmIChsaXN0ID09IG51bGwpIHJldHVybiB7fTtcbiAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBsaXN0Lmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgaWYgKHZhbHVlcykge1xuICAgICAgICByZXN1bHRbbGlzdFtpXV0gPSB2YWx1ZXNbaV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHRbbGlzdFtpXVswXV0gPSBsaXN0W2ldWzFdO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIElmIHRoZSBicm93c2VyIGRvZXNuJ3Qgc3VwcGx5IHVzIHdpdGggaW5kZXhPZiAoSSdtIGxvb2tpbmcgYXQgeW91LCAqKk1TSUUqKiksXG4gIC8vIHdlIG5lZWQgdGhpcyBmdW5jdGlvbi4gUmV0dXJuIHRoZSBwb3NpdGlvbiBvZiB0aGUgZmlyc3Qgb2NjdXJyZW5jZSBvZiBhblxuICAvLyBpdGVtIGluIGFuIGFycmF5LCBvciAtMSBpZiB0aGUgaXRlbSBpcyBub3QgaW5jbHVkZWQgaW4gdGhlIGFycmF5LlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgaW5kZXhPZmAgaWYgYXZhaWxhYmxlLlxuICAvLyBJZiB0aGUgYXJyYXkgaXMgbGFyZ2UgYW5kIGFscmVhZHkgaW4gc29ydCBvcmRlciwgcGFzcyBgdHJ1ZWBcbiAgLy8gZm9yICoqaXNTb3J0ZWQqKiB0byB1c2UgYmluYXJ5IHNlYXJjaC5cbiAgXy5pbmRleE9mID0gZnVuY3Rpb24oYXJyYXksIGl0ZW0sIGlzU29ydGVkKSB7XG4gICAgaWYgKGFycmF5ID09IG51bGwpIHJldHVybiAtMTtcbiAgICB2YXIgaSA9IDAsIGwgPSBhcnJheS5sZW5ndGg7XG4gICAgaWYgKGlzU29ydGVkKSB7XG4gICAgICBpZiAodHlwZW9mIGlzU29ydGVkID09ICdudW1iZXInKSB7XG4gICAgICAgIGkgPSAoaXNTb3J0ZWQgPCAwID8gTWF0aC5tYXgoMCwgbCArIGlzU29ydGVkKSA6IGlzU29ydGVkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGkgPSBfLnNvcnRlZEluZGV4KGFycmF5LCBpdGVtKTtcbiAgICAgICAgcmV0dXJuIGFycmF5W2ldID09PSBpdGVtID8gaSA6IC0xO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAobmF0aXZlSW5kZXhPZiAmJiBhcnJheS5pbmRleE9mID09PSBuYXRpdmVJbmRleE9mKSByZXR1cm4gYXJyYXkuaW5kZXhPZihpdGVtLCBpc1NvcnRlZCk7XG4gICAgZm9yICg7IGkgPCBsOyBpKyspIGlmIChhcnJheVtpXSA9PT0gaXRlbSkgcmV0dXJuIGk7XG4gICAgcmV0dXJuIC0xO1xuICB9O1xuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBsYXN0SW5kZXhPZmAgaWYgYXZhaWxhYmxlLlxuICBfLmxhc3RJbmRleE9mID0gZnVuY3Rpb24oYXJyYXksIGl0ZW0sIGZyb20pIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIC0xO1xuICAgIHZhciBoYXNJbmRleCA9IGZyb20gIT0gbnVsbDtcbiAgICBpZiAobmF0aXZlTGFzdEluZGV4T2YgJiYgYXJyYXkubGFzdEluZGV4T2YgPT09IG5hdGl2ZUxhc3RJbmRleE9mKSB7XG4gICAgICByZXR1cm4gaGFzSW5kZXggPyBhcnJheS5sYXN0SW5kZXhPZihpdGVtLCBmcm9tKSA6IGFycmF5Lmxhc3RJbmRleE9mKGl0ZW0pO1xuICAgIH1cbiAgICB2YXIgaSA9IChoYXNJbmRleCA/IGZyb20gOiBhcnJheS5sZW5ndGgpO1xuICAgIHdoaWxlIChpLS0pIGlmIChhcnJheVtpXSA9PT0gaXRlbSkgcmV0dXJuIGk7XG4gICAgcmV0dXJuIC0xO1xuICB9O1xuXG4gIC8vIEdlbmVyYXRlIGFuIGludGVnZXIgQXJyYXkgY29udGFpbmluZyBhbiBhcml0aG1ldGljIHByb2dyZXNzaW9uLiBBIHBvcnQgb2ZcbiAgLy8gdGhlIG5hdGl2ZSBQeXRob24gYHJhbmdlKClgIGZ1bmN0aW9uLiBTZWVcbiAgLy8gW3RoZSBQeXRob24gZG9jdW1lbnRhdGlvbl0oaHR0cDovL2RvY3MucHl0aG9uLm9yZy9saWJyYXJ5L2Z1bmN0aW9ucy5odG1sI3JhbmdlKS5cbiAgXy5yYW5nZSA9IGZ1bmN0aW9uKHN0YXJ0LCBzdG9wLCBzdGVwKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPD0gMSkge1xuICAgICAgc3RvcCA9IHN0YXJ0IHx8IDA7XG4gICAgICBzdGFydCA9IDA7XG4gICAgfVxuICAgIHN0ZXAgPSBhcmd1bWVudHNbMl0gfHwgMTtcblxuICAgIHZhciBsZW4gPSBNYXRoLm1heChNYXRoLmNlaWwoKHN0b3AgLSBzdGFydCkgLyBzdGVwKSwgMCk7XG4gICAgdmFyIGlkeCA9IDA7XG4gICAgdmFyIHJhbmdlID0gbmV3IEFycmF5KGxlbik7XG5cbiAgICB3aGlsZShpZHggPCBsZW4pIHtcbiAgICAgIHJhbmdlW2lkeCsrXSA9IHN0YXJ0O1xuICAgICAgc3RhcnQgKz0gc3RlcDtcbiAgICB9XG5cbiAgICByZXR1cm4gcmFuZ2U7XG4gIH07XG5cbiAgLy8gRnVuY3Rpb24gKGFoZW0pIEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBDcmVhdGUgYSBmdW5jdGlvbiBib3VuZCB0byBhIGdpdmVuIG9iamVjdCAoYXNzaWduaW5nIGB0aGlzYCwgYW5kIGFyZ3VtZW50cyxcbiAgLy8gb3B0aW9uYWxseSkuIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBGdW5jdGlvbi5iaW5kYCBpZlxuICAvLyBhdmFpbGFibGUuXG4gIF8uYmluZCA9IGZ1bmN0aW9uKGZ1bmMsIGNvbnRleHQpIHtcbiAgICBpZiAoZnVuYy5iaW5kID09PSBuYXRpdmVCaW5kICYmIG5hdGl2ZUJpbmQpIHJldHVybiBuYXRpdmVCaW5kLmFwcGx5KGZ1bmMsIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncy5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgfTtcbiAgfTtcblxuICAvLyBQYXJ0aWFsbHkgYXBwbHkgYSBmdW5jdGlvbiBieSBjcmVhdGluZyBhIHZlcnNpb24gdGhhdCBoYXMgaGFkIHNvbWUgb2YgaXRzXG4gIC8vIGFyZ3VtZW50cyBwcmUtZmlsbGVkLCB3aXRob3V0IGNoYW5naW5nIGl0cyBkeW5hbWljIGB0aGlzYCBjb250ZXh0LlxuICBfLnBhcnRpYWwgPSBmdW5jdGlvbihmdW5jKSB7XG4gICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJncy5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgfTtcbiAgfTtcblxuICAvLyBCaW5kIGFsbCBvZiBhbiBvYmplY3QncyBtZXRob2RzIHRvIHRoYXQgb2JqZWN0LiBVc2VmdWwgZm9yIGVuc3VyaW5nIHRoYXRcbiAgLy8gYWxsIGNhbGxiYWNrcyBkZWZpbmVkIG9uIGFuIG9iamVjdCBiZWxvbmcgdG8gaXQuXG4gIF8uYmluZEFsbCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBmdW5jcyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICBpZiAoZnVuY3MubGVuZ3RoID09PSAwKSBmdW5jcyA9IF8uZnVuY3Rpb25zKG9iaik7XG4gICAgZWFjaChmdW5jcywgZnVuY3Rpb24oZikgeyBvYmpbZl0gPSBfLmJpbmQob2JqW2ZdLCBvYmopOyB9KTtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIE1lbW9pemUgYW4gZXhwZW5zaXZlIGZ1bmN0aW9uIGJ5IHN0b3JpbmcgaXRzIHJlc3VsdHMuXG4gIF8ubWVtb2l6ZSA9IGZ1bmN0aW9uKGZ1bmMsIGhhc2hlcikge1xuICAgIHZhciBtZW1vID0ge307XG4gICAgaGFzaGVyIHx8IChoYXNoZXIgPSBfLmlkZW50aXR5KTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIga2V5ID0gaGFzaGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gXy5oYXMobWVtbywga2V5KSA/IG1lbW9ba2V5XSA6IChtZW1vW2tleV0gPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpO1xuICAgIH07XG4gIH07XG5cbiAgLy8gRGVsYXlzIGEgZnVuY3Rpb24gZm9yIHRoZSBnaXZlbiBudW1iZXIgb2YgbWlsbGlzZWNvbmRzLCBhbmQgdGhlbiBjYWxsc1xuICAvLyBpdCB3aXRoIHRoZSBhcmd1bWVudHMgc3VwcGxpZWQuXG4gIF8uZGVsYXkgPSBmdW5jdGlvbihmdW5jLCB3YWl0KSB7XG4gICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgcmV0dXJuIGZ1bmMuYXBwbHkobnVsbCwgYXJncyk7IH0sIHdhaXQpO1xuICB9O1xuXG4gIC8vIERlZmVycyBhIGZ1bmN0aW9uLCBzY2hlZHVsaW5nIGl0IHRvIHJ1biBhZnRlciB0aGUgY3VycmVudCBjYWxsIHN0YWNrIGhhc1xuICAvLyBjbGVhcmVkLlxuICBfLmRlZmVyID0gZnVuY3Rpb24oZnVuYykge1xuICAgIHJldHVybiBfLmRlbGF5LmFwcGx5KF8sIFtmdW5jLCAxXS5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKSk7XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uLCB0aGF0LCB3aGVuIGludm9rZWQsIHdpbGwgb25seSBiZSB0cmlnZ2VyZWQgYXQgbW9zdCBvbmNlXG4gIC8vIGR1cmluZyBhIGdpdmVuIHdpbmRvdyBvZiB0aW1lLlxuICBfLnRocm90dGxlID0gZnVuY3Rpb24oZnVuYywgd2FpdCkge1xuICAgIHZhciBjb250ZXh0LCBhcmdzLCB0aW1lb3V0LCByZXN1bHQ7XG4gICAgdmFyIHByZXZpb3VzID0gMDtcbiAgICB2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIHByZXZpb3VzID0gbmV3IERhdGU7XG4gICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgfTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbm93ID0gbmV3IERhdGU7XG4gICAgICB2YXIgcmVtYWluaW5nID0gd2FpdCAtIChub3cgLSBwcmV2aW91cyk7XG4gICAgICBjb250ZXh0ID0gdGhpcztcbiAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICBpZiAocmVtYWluaW5nIDw9IDApIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgICAgcHJldmlvdXMgPSBub3c7XG4gICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICB9IGVsc2UgaWYgKCF0aW1lb3V0KSB7XG4gICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCByZW1haW5pbmcpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiwgdGhhdCwgYXMgbG9uZyBhcyBpdCBjb250aW51ZXMgdG8gYmUgaW52b2tlZCwgd2lsbCBub3RcbiAgLy8gYmUgdHJpZ2dlcmVkLiBUaGUgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgYWZ0ZXIgaXQgc3RvcHMgYmVpbmcgY2FsbGVkIGZvclxuICAvLyBOIG1pbGxpc2Vjb25kcy4gSWYgYGltbWVkaWF0ZWAgaXMgcGFzc2VkLCB0cmlnZ2VyIHRoZSBmdW5jdGlvbiBvbiB0aGVcbiAgLy8gbGVhZGluZyBlZGdlLCBpbnN0ZWFkIG9mIHRoZSB0cmFpbGluZy5cbiAgXy5kZWJvdW5jZSA9IGZ1bmN0aW9uKGZ1bmMsIHdhaXQsIGltbWVkaWF0ZSkge1xuICAgIHZhciB0aW1lb3V0LCByZXN1bHQ7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGNvbnRleHQgPSB0aGlzLCBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgdmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICBpZiAoIWltbWVkaWF0ZSkgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgIH07XG4gICAgICB2YXIgY2FsbE5vdyA9IGltbWVkaWF0ZSAmJiAhdGltZW91dDtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0KTtcbiAgICAgIGlmIChjYWxsTm93KSByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgZXhlY3V0ZWQgYXQgbW9zdCBvbmUgdGltZSwgbm8gbWF0dGVyIGhvd1xuICAvLyBvZnRlbiB5b3UgY2FsbCBpdC4gVXNlZnVsIGZvciBsYXp5IGluaXRpYWxpemF0aW9uLlxuICBfLm9uY2UgPSBmdW5jdGlvbihmdW5jKSB7XG4gICAgdmFyIHJhbiA9IGZhbHNlLCBtZW1vO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChyYW4pIHJldHVybiBtZW1vO1xuICAgICAgcmFuID0gdHJ1ZTtcbiAgICAgIG1lbW8gPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICBmdW5jID0gbnVsbDtcbiAgICAgIHJldHVybiBtZW1vO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyB0aGUgZmlyc3QgZnVuY3Rpb24gcGFzc2VkIGFzIGFuIGFyZ3VtZW50IHRvIHRoZSBzZWNvbmQsXG4gIC8vIGFsbG93aW5nIHlvdSB0byBhZGp1c3QgYXJndW1lbnRzLCBydW4gY29kZSBiZWZvcmUgYW5kIGFmdGVyLCBhbmRcbiAgLy8gY29uZGl0aW9uYWxseSBleGVjdXRlIHRoZSBvcmlnaW5hbCBmdW5jdGlvbi5cbiAgXy53cmFwID0gZnVuY3Rpb24oZnVuYywgd3JhcHBlcikge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBhcmdzID0gW2Z1bmNdO1xuICAgICAgcHVzaC5hcHBseShhcmdzLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHdyYXBwZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCBpcyB0aGUgY29tcG9zaXRpb24gb2YgYSBsaXN0IG9mIGZ1bmN0aW9ucywgZWFjaFxuICAvLyBjb25zdW1pbmcgdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgZnVuY3Rpb24gdGhhdCBmb2xsb3dzLlxuICBfLmNvbXBvc2UgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZnVuY3MgPSBhcmd1bWVudHM7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICBmb3IgKHZhciBpID0gZnVuY3MubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgYXJncyA9IFtmdW5jc1tpXS5hcHBseSh0aGlzLCBhcmdzKV07XG4gICAgICB9XG4gICAgICByZXR1cm4gYXJnc1swXTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHdpbGwgb25seSBiZSBleGVjdXRlZCBhZnRlciBiZWluZyBjYWxsZWQgTiB0aW1lcy5cbiAgXy5hZnRlciA9IGZ1bmN0aW9uKHRpbWVzLCBmdW5jKSB7XG4gICAgaWYgKHRpbWVzIDw9IDApIHJldHVybiBmdW5jKCk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKC0tdGltZXMgPCAxKSB7XG4gICAgICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB9XG4gICAgfTtcbiAgfTtcblxuICAvLyBPYmplY3QgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBSZXRyaWV2ZSB0aGUgbmFtZXMgb2YgYW4gb2JqZWN0J3MgcHJvcGVydGllcy5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYE9iamVjdC5rZXlzYFxuICBfLmtleXMgPSBuYXRpdmVLZXlzIHx8IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmIChvYmogIT09IE9iamVjdChvYmopKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIG9iamVjdCcpO1xuICAgIHZhciBrZXlzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikgaWYgKF8uaGFzKG9iaiwga2V5KSkga2V5c1trZXlzLmxlbmd0aF0gPSBrZXk7XG4gICAgcmV0dXJuIGtleXM7XG4gIH07XG5cbiAgLy8gUmV0cmlldmUgdGhlIHZhbHVlcyBvZiBhbiBvYmplY3QncyBwcm9wZXJ0aWVzLlxuICBfLnZhbHVlcyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciB2YWx1ZXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSBpZiAoXy5oYXMob2JqLCBrZXkpKSB2YWx1ZXMucHVzaChvYmpba2V5XSk7XG4gICAgcmV0dXJuIHZhbHVlcztcbiAgfTtcblxuICAvLyBDb252ZXJ0IGFuIG9iamVjdCBpbnRvIGEgbGlzdCBvZiBgW2tleSwgdmFsdWVdYCBwYWlycy5cbiAgXy5wYWlycyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBwYWlycyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIGlmIChfLmhhcyhvYmosIGtleSkpIHBhaXJzLnB1c2goW2tleSwgb2JqW2tleV1dKTtcbiAgICByZXR1cm4gcGFpcnM7XG4gIH07XG5cbiAgLy8gSW52ZXJ0IHRoZSBrZXlzIGFuZCB2YWx1ZXMgb2YgYW4gb2JqZWN0LiBUaGUgdmFsdWVzIG11c3QgYmUgc2VyaWFsaXphYmxlLlxuICBfLmludmVydCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSBpZiAoXy5oYXMob2JqLCBrZXkpKSByZXN1bHRbb2JqW2tleV1dID0ga2V5O1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgc29ydGVkIGxpc3Qgb2YgdGhlIGZ1bmN0aW9uIG5hbWVzIGF2YWlsYWJsZSBvbiB0aGUgb2JqZWN0LlxuICAvLyBBbGlhc2VkIGFzIGBtZXRob2RzYFxuICBfLmZ1bmN0aW9ucyA9IF8ubWV0aG9kcyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBuYW1lcyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgIGlmIChfLmlzRnVuY3Rpb24ob2JqW2tleV0pKSBuYW1lcy5wdXNoKGtleSk7XG4gICAgfVxuICAgIHJldHVybiBuYW1lcy5zb3J0KCk7XG4gIH07XG5cbiAgLy8gRXh0ZW5kIGEgZ2l2ZW4gb2JqZWN0IHdpdGggYWxsIHRoZSBwcm9wZXJ0aWVzIGluIHBhc3NlZC1pbiBvYmplY3QocykuXG4gIF8uZXh0ZW5kID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgZWFjaChzbGljZS5jYWxsKGFyZ3VtZW50cywgMSksIGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgICAgaWYgKHNvdXJjZSkge1xuICAgICAgICBmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xuICAgICAgICAgIG9ialtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgY29weSBvZiB0aGUgb2JqZWN0IG9ubHkgY29udGFpbmluZyB0aGUgd2hpdGVsaXN0ZWQgcHJvcGVydGllcy5cbiAgXy5waWNrID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGNvcHkgPSB7fTtcbiAgICB2YXIga2V5cyA9IGNvbmNhdC5hcHBseShBcnJheVByb3RvLCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIGVhY2goa2V5cywgZnVuY3Rpb24oa2V5KSB7XG4gICAgICBpZiAoa2V5IGluIG9iaikgY29weVtrZXldID0gb2JqW2tleV07XG4gICAgfSk7XG4gICAgcmV0dXJuIGNvcHk7XG4gIH07XG5cbiAgIC8vIFJldHVybiBhIGNvcHkgb2YgdGhlIG9iamVjdCB3aXRob3V0IHRoZSBibGFja2xpc3RlZCBwcm9wZXJ0aWVzLlxuICBfLm9taXQgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgY29weSA9IHt9O1xuICAgIHZhciBrZXlzID0gY29uY2F0LmFwcGx5KEFycmF5UHJvdG8sIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgaWYgKCFfLmNvbnRhaW5zKGtleXMsIGtleSkpIGNvcHlba2V5XSA9IG9ialtrZXldO1xuICAgIH1cbiAgICByZXR1cm4gY29weTtcbiAgfTtcblxuICAvLyBGaWxsIGluIGEgZ2l2ZW4gb2JqZWN0IHdpdGggZGVmYXVsdCBwcm9wZXJ0aWVzLlxuICBfLmRlZmF1bHRzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgZWFjaChzbGljZS5jYWxsKGFyZ3VtZW50cywgMSksIGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgICAgaWYgKHNvdXJjZSkge1xuICAgICAgICBmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xuICAgICAgICAgIGlmIChvYmpbcHJvcF0gPT0gbnVsbCkgb2JqW3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBDcmVhdGUgYSAoc2hhbGxvdy1jbG9uZWQpIGR1cGxpY2F0ZSBvZiBhbiBvYmplY3QuXG4gIF8uY2xvbmUgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAoIV8uaXNPYmplY3Qob2JqKSkgcmV0dXJuIG9iajtcbiAgICByZXR1cm4gXy5pc0FycmF5KG9iaikgPyBvYmouc2xpY2UoKSA6IF8uZXh0ZW5kKHt9LCBvYmopO1xuICB9O1xuXG4gIC8vIEludm9rZXMgaW50ZXJjZXB0b3Igd2l0aCB0aGUgb2JqLCBhbmQgdGhlbiByZXR1cm5zIG9iai5cbiAgLy8gVGhlIHByaW1hcnkgcHVycG9zZSBvZiB0aGlzIG1ldGhvZCBpcyB0byBcInRhcCBpbnRvXCIgYSBtZXRob2QgY2hhaW4sIGluXG4gIC8vIG9yZGVyIHRvIHBlcmZvcm0gb3BlcmF0aW9ucyBvbiBpbnRlcm1lZGlhdGUgcmVzdWx0cyB3aXRoaW4gdGhlIGNoYWluLlxuICBfLnRhcCA9IGZ1bmN0aW9uKG9iaiwgaW50ZXJjZXB0b3IpIHtcbiAgICBpbnRlcmNlcHRvcihvYmopO1xuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gSW50ZXJuYWwgcmVjdXJzaXZlIGNvbXBhcmlzb24gZnVuY3Rpb24gZm9yIGBpc0VxdWFsYC5cbiAgdmFyIGVxID0gZnVuY3Rpb24oYSwgYiwgYVN0YWNrLCBiU3RhY2spIHtcbiAgICAvLyBJZGVudGljYWwgb2JqZWN0cyBhcmUgZXF1YWwuIGAwID09PSAtMGAsIGJ1dCB0aGV5IGFyZW4ndCBpZGVudGljYWwuXG4gICAgLy8gU2VlIHRoZSBIYXJtb255IGBlZ2FsYCBwcm9wb3NhbDogaHR0cDovL3dpa2kuZWNtYXNjcmlwdC5vcmcvZG9rdS5waHA/aWQ9aGFybW9ueTplZ2FsLlxuICAgIGlmIChhID09PSBiKSByZXR1cm4gYSAhPT0gMCB8fCAxIC8gYSA9PSAxIC8gYjtcbiAgICAvLyBBIHN0cmljdCBjb21wYXJpc29uIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIGBudWxsID09IHVuZGVmaW5lZGAuXG4gICAgaWYgKGEgPT0gbnVsbCB8fCBiID09IG51bGwpIHJldHVybiBhID09PSBiO1xuICAgIC8vIFVud3JhcCBhbnkgd3JhcHBlZCBvYmplY3RzLlxuICAgIGlmIChhIGluc3RhbmNlb2YgXykgYSA9IGEuX3dyYXBwZWQ7XG4gICAgaWYgKGIgaW5zdGFuY2VvZiBfKSBiID0gYi5fd3JhcHBlZDtcbiAgICAvLyBDb21wYXJlIGBbW0NsYXNzXV1gIG5hbWVzLlxuICAgIHZhciBjbGFzc05hbWUgPSB0b1N0cmluZy5jYWxsKGEpO1xuICAgIGlmIChjbGFzc05hbWUgIT0gdG9TdHJpbmcuY2FsbChiKSkgcmV0dXJuIGZhbHNlO1xuICAgIHN3aXRjaCAoY2xhc3NOYW1lKSB7XG4gICAgICAvLyBTdHJpbmdzLCBudW1iZXJzLCBkYXRlcywgYW5kIGJvb2xlYW5zIGFyZSBjb21wYXJlZCBieSB2YWx1ZS5cbiAgICAgIGNhc2UgJ1tvYmplY3QgU3RyaW5nXSc6XG4gICAgICAgIC8vIFByaW1pdGl2ZXMgYW5kIHRoZWlyIGNvcnJlc3BvbmRpbmcgb2JqZWN0IHdyYXBwZXJzIGFyZSBlcXVpdmFsZW50OyB0aHVzLCBgXCI1XCJgIGlzXG4gICAgICAgIC8vIGVxdWl2YWxlbnQgdG8gYG5ldyBTdHJpbmcoXCI1XCIpYC5cbiAgICAgICAgcmV0dXJuIGEgPT0gU3RyaW5nKGIpO1xuICAgICAgY2FzZSAnW29iamVjdCBOdW1iZXJdJzpcbiAgICAgICAgLy8gYE5hTmBzIGFyZSBlcXVpdmFsZW50LCBidXQgbm9uLXJlZmxleGl2ZS4gQW4gYGVnYWxgIGNvbXBhcmlzb24gaXMgcGVyZm9ybWVkIGZvclxuICAgICAgICAvLyBvdGhlciBudW1lcmljIHZhbHVlcy5cbiAgICAgICAgcmV0dXJuIGEgIT0gK2EgPyBiICE9ICtiIDogKGEgPT0gMCA/IDEgLyBhID09IDEgLyBiIDogYSA9PSArYik7XG4gICAgICBjYXNlICdbb2JqZWN0IERhdGVdJzpcbiAgICAgIGNhc2UgJ1tvYmplY3QgQm9vbGVhbl0nOlxuICAgICAgICAvLyBDb2VyY2UgZGF0ZXMgYW5kIGJvb2xlYW5zIHRvIG51bWVyaWMgcHJpbWl0aXZlIHZhbHVlcy4gRGF0ZXMgYXJlIGNvbXBhcmVkIGJ5IHRoZWlyXG4gICAgICAgIC8vIG1pbGxpc2Vjb25kIHJlcHJlc2VudGF0aW9ucy4gTm90ZSB0aGF0IGludmFsaWQgZGF0ZXMgd2l0aCBtaWxsaXNlY29uZCByZXByZXNlbnRhdGlvbnNcbiAgICAgICAgLy8gb2YgYE5hTmAgYXJlIG5vdCBlcXVpdmFsZW50LlxuICAgICAgICByZXR1cm4gK2EgPT0gK2I7XG4gICAgICAvLyBSZWdFeHBzIGFyZSBjb21wYXJlZCBieSB0aGVpciBzb3VyY2UgcGF0dGVybnMgYW5kIGZsYWdzLlxuICAgICAgY2FzZSAnW29iamVjdCBSZWdFeHBdJzpcbiAgICAgICAgcmV0dXJuIGEuc291cmNlID09IGIuc291cmNlICYmXG4gICAgICAgICAgICAgICBhLmdsb2JhbCA9PSBiLmdsb2JhbCAmJlxuICAgICAgICAgICAgICAgYS5tdWx0aWxpbmUgPT0gYi5tdWx0aWxpbmUgJiZcbiAgICAgICAgICAgICAgIGEuaWdub3JlQ2FzZSA9PSBiLmlnbm9yZUNhc2U7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgYSAhPSAnb2JqZWN0JyB8fCB0eXBlb2YgYiAhPSAnb2JqZWN0JykgcmV0dXJuIGZhbHNlO1xuICAgIC8vIEFzc3VtZSBlcXVhbGl0eSBmb3IgY3ljbGljIHN0cnVjdHVyZXMuIFRoZSBhbGdvcml0aG0gZm9yIGRldGVjdGluZyBjeWNsaWNcbiAgICAvLyBzdHJ1Y3R1cmVzIGlzIGFkYXB0ZWQgZnJvbSBFUyA1LjEgc2VjdGlvbiAxNS4xMi4zLCBhYnN0cmFjdCBvcGVyYXRpb24gYEpPYC5cbiAgICB2YXIgbGVuZ3RoID0gYVN0YWNrLmxlbmd0aDtcbiAgICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICAgIC8vIExpbmVhciBzZWFyY2guIFBlcmZvcm1hbmNlIGlzIGludmVyc2VseSBwcm9wb3J0aW9uYWwgdG8gdGhlIG51bWJlciBvZlxuICAgICAgLy8gdW5pcXVlIG5lc3RlZCBzdHJ1Y3R1cmVzLlxuICAgICAgaWYgKGFTdGFja1tsZW5ndGhdID09IGEpIHJldHVybiBiU3RhY2tbbGVuZ3RoXSA9PSBiO1xuICAgIH1cbiAgICAvLyBBZGQgdGhlIGZpcnN0IG9iamVjdCB0byB0aGUgc3RhY2sgb2YgdHJhdmVyc2VkIG9iamVjdHMuXG4gICAgYVN0YWNrLnB1c2goYSk7XG4gICAgYlN0YWNrLnB1c2goYik7XG4gICAgdmFyIHNpemUgPSAwLCByZXN1bHQgPSB0cnVlO1xuICAgIC8vIFJlY3Vyc2l2ZWx5IGNvbXBhcmUgb2JqZWN0cyBhbmQgYXJyYXlzLlxuICAgIGlmIChjbGFzc05hbWUgPT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgLy8gQ29tcGFyZSBhcnJheSBsZW5ndGhzIHRvIGRldGVybWluZSBpZiBhIGRlZXAgY29tcGFyaXNvbiBpcyBuZWNlc3NhcnkuXG4gICAgICBzaXplID0gYS5sZW5ndGg7XG4gICAgICByZXN1bHQgPSBzaXplID09IGIubGVuZ3RoO1xuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAvLyBEZWVwIGNvbXBhcmUgdGhlIGNvbnRlbnRzLCBpZ25vcmluZyBub24tbnVtZXJpYyBwcm9wZXJ0aWVzLlxuICAgICAgICB3aGlsZSAoc2l6ZS0tKSB7XG4gICAgICAgICAgaWYgKCEocmVzdWx0ID0gZXEoYVtzaXplXSwgYltzaXplXSwgYVN0YWNrLCBiU3RhY2spKSkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gT2JqZWN0cyB3aXRoIGRpZmZlcmVudCBjb25zdHJ1Y3RvcnMgYXJlIG5vdCBlcXVpdmFsZW50LCBidXQgYE9iamVjdGBzXG4gICAgICAvLyBmcm9tIGRpZmZlcmVudCBmcmFtZXMgYXJlLlxuICAgICAgdmFyIGFDdG9yID0gYS5jb25zdHJ1Y3RvciwgYkN0b3IgPSBiLmNvbnN0cnVjdG9yO1xuICAgICAgaWYgKGFDdG9yICE9PSBiQ3RvciAmJiAhKF8uaXNGdW5jdGlvbihhQ3RvcikgJiYgKGFDdG9yIGluc3RhbmNlb2YgYUN0b3IpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXy5pc0Z1bmN0aW9uKGJDdG9yKSAmJiAoYkN0b3IgaW5zdGFuY2VvZiBiQ3RvcikpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIC8vIERlZXAgY29tcGFyZSBvYmplY3RzLlxuICAgICAgZm9yICh2YXIga2V5IGluIGEpIHtcbiAgICAgICAgaWYgKF8uaGFzKGEsIGtleSkpIHtcbiAgICAgICAgICAvLyBDb3VudCB0aGUgZXhwZWN0ZWQgbnVtYmVyIG9mIHByb3BlcnRpZXMuXG4gICAgICAgICAgc2l6ZSsrO1xuICAgICAgICAgIC8vIERlZXAgY29tcGFyZSBlYWNoIG1lbWJlci5cbiAgICAgICAgICBpZiAoIShyZXN1bHQgPSBfLmhhcyhiLCBrZXkpICYmIGVxKGFba2V5XSwgYltrZXldLCBhU3RhY2ssIGJTdGFjaykpKSBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gRW5zdXJlIHRoYXQgYm90aCBvYmplY3RzIGNvbnRhaW4gdGhlIHNhbWUgbnVtYmVyIG9mIHByb3BlcnRpZXMuXG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIGZvciAoa2V5IGluIGIpIHtcbiAgICAgICAgICBpZiAoXy5oYXMoYiwga2V5KSAmJiAhKHNpemUtLSkpIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdCA9ICFzaXplO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBSZW1vdmUgdGhlIGZpcnN0IG9iamVjdCBmcm9tIHRoZSBzdGFjayBvZiB0cmF2ZXJzZWQgb2JqZWN0cy5cbiAgICBhU3RhY2sucG9wKCk7XG4gICAgYlN0YWNrLnBvcCgpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gUGVyZm9ybSBhIGRlZXAgY29tcGFyaXNvbiB0byBjaGVjayBpZiB0d28gb2JqZWN0cyBhcmUgZXF1YWwuXG4gIF8uaXNFcXVhbCA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICByZXR1cm4gZXEoYSwgYiwgW10sIFtdKTtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIGFycmF5LCBzdHJpbmcsIG9yIG9iamVjdCBlbXB0eT9cbiAgLy8gQW4gXCJlbXB0eVwiIG9iamVjdCBoYXMgbm8gZW51bWVyYWJsZSBvd24tcHJvcGVydGllcy5cbiAgXy5pc0VtcHR5ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoXy5pc0FycmF5KG9iaikgfHwgXy5pc1N0cmluZyhvYmopKSByZXR1cm4gb2JqLmxlbmd0aCA9PT0gMDtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSBpZiAoXy5oYXMob2JqLCBrZXkpKSByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBhIERPTSBlbGVtZW50P1xuICBfLmlzRWxlbWVudCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiAhIShvYmogJiYgb2JqLm5vZGVUeXBlID09PSAxKTtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGFuIGFycmF5P1xuICAvLyBEZWxlZ2F0ZXMgdG8gRUNNQTUncyBuYXRpdmUgQXJyYXkuaXNBcnJheVxuICBfLmlzQXJyYXkgPSBuYXRpdmVJc0FycmF5IHx8IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT0gJ1tvYmplY3QgQXJyYXldJztcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhcmlhYmxlIGFuIG9iamVjdD9cbiAgXy5pc09iamVjdCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IE9iamVjdChvYmopO1xuICB9O1xuXG4gIC8vIEFkZCBzb21lIGlzVHlwZSBtZXRob2RzOiBpc0FyZ3VtZW50cywgaXNGdW5jdGlvbiwgaXNTdHJpbmcsIGlzTnVtYmVyLCBpc0RhdGUsIGlzUmVnRXhwLlxuICBlYWNoKFsnQXJndW1lbnRzJywgJ0Z1bmN0aW9uJywgJ1N0cmluZycsICdOdW1iZXInLCAnRGF0ZScsICdSZWdFeHAnXSwgZnVuY3Rpb24obmFtZSkge1xuICAgIF9bJ2lzJyArIG5hbWVdID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09ICdbb2JqZWN0ICcgKyBuYW1lICsgJ10nO1xuICAgIH07XG4gIH0pO1xuXG4gIC8vIERlZmluZSBhIGZhbGxiYWNrIHZlcnNpb24gb2YgdGhlIG1ldGhvZCBpbiBicm93c2VycyAoYWhlbSwgSUUpLCB3aGVyZVxuICAvLyB0aGVyZSBpc24ndCBhbnkgaW5zcGVjdGFibGUgXCJBcmd1bWVudHNcIiB0eXBlLlxuICBpZiAoIV8uaXNBcmd1bWVudHMoYXJndW1lbnRzKSkge1xuICAgIF8uaXNBcmd1bWVudHMgPSBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiAhIShvYmogJiYgXy5oYXMob2JqLCAnY2FsbGVlJykpO1xuICAgIH07XG4gIH1cblxuICAvLyBPcHRpbWl6ZSBgaXNGdW5jdGlvbmAgaWYgYXBwcm9wcmlhdGUuXG4gIGlmICh0eXBlb2YgKC8uLykgIT09ICdmdW5jdGlvbicpIHtcbiAgICBfLmlzRnVuY3Rpb24gPSBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiB0eXBlb2Ygb2JqID09PSAnZnVuY3Rpb24nO1xuICAgIH07XG4gIH1cblxuICAvLyBJcyBhIGdpdmVuIG9iamVjdCBhIGZpbml0ZSBudW1iZXI/XG4gIF8uaXNGaW5pdGUgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gaXNGaW5pdGUob2JqKSAmJiAhaXNOYU4ocGFyc2VGbG9hdChvYmopKTtcbiAgfTtcblxuICAvLyBJcyB0aGUgZ2l2ZW4gdmFsdWUgYE5hTmA/IChOYU4gaXMgdGhlIG9ubHkgbnVtYmVyIHdoaWNoIGRvZXMgbm90IGVxdWFsIGl0c2VsZikuXG4gIF8uaXNOYU4gPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gXy5pc051bWJlcihvYmopICYmIG9iaiAhPSArb2JqO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgYSBib29sZWFuP1xuICBfLmlzQm9vbGVhbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IHRydWUgfHwgb2JqID09PSBmYWxzZSB8fCB0b1N0cmluZy5jYWxsKG9iaikgPT0gJ1tvYmplY3QgQm9vbGVhbl0nO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgZXF1YWwgdG8gbnVsbD9cbiAgXy5pc051bGwgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSBudWxsO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFyaWFibGUgdW5kZWZpbmVkP1xuICBfLmlzVW5kZWZpbmVkID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gdm9pZCAwO1xuICB9O1xuXG4gIC8vIFNob3J0Y3V0IGZ1bmN0aW9uIGZvciBjaGVja2luZyBpZiBhbiBvYmplY3QgaGFzIGEgZ2l2ZW4gcHJvcGVydHkgZGlyZWN0bHlcbiAgLy8gb24gaXRzZWxmIChpbiBvdGhlciB3b3Jkcywgbm90IG9uIGEgcHJvdG90eXBlKS5cbiAgXy5oYXMgPSBmdW5jdGlvbihvYmosIGtleSkge1xuICAgIHJldHVybiBoYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KTtcbiAgfTtcblxuICAvLyBVdGlsaXR5IEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFJ1biBVbmRlcnNjb3JlLmpzIGluICpub0NvbmZsaWN0KiBtb2RlLCByZXR1cm5pbmcgdGhlIGBfYCB2YXJpYWJsZSB0byBpdHNcbiAgLy8gcHJldmlvdXMgb3duZXIuIFJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIFVuZGVyc2NvcmUgb2JqZWN0LlxuICBfLm5vQ29uZmxpY3QgPSBmdW5jdGlvbigpIHtcbiAgICByb290Ll8gPSBwcmV2aW91c1VuZGVyc2NvcmU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLy8gS2VlcCB0aGUgaWRlbnRpdHkgZnVuY3Rpb24gYXJvdW5kIGZvciBkZWZhdWx0IGl0ZXJhdG9ycy5cbiAgXy5pZGVudGl0eSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9O1xuXG4gIC8vIFJ1biBhIGZ1bmN0aW9uICoqbioqIHRpbWVzLlxuICBfLnRpbWVzID0gZnVuY3Rpb24obiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICB2YXIgYWNjdW0gPSBBcnJheShuKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47IGkrKykgYWNjdW1baV0gPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIGkpO1xuICAgIHJldHVybiBhY2N1bTtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSByYW5kb20gaW50ZWdlciBiZXR3ZWVuIG1pbiBhbmQgbWF4IChpbmNsdXNpdmUpLlxuICBfLnJhbmRvbSA9IGZ1bmN0aW9uKG1pbiwgbWF4KSB7XG4gICAgaWYgKG1heCA9PSBudWxsKSB7XG4gICAgICBtYXggPSBtaW47XG4gICAgICBtaW4gPSAwO1xuICAgIH1cbiAgICByZXR1cm4gbWluICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKTtcbiAgfTtcblxuICAvLyBMaXN0IG9mIEhUTUwgZW50aXRpZXMgZm9yIGVzY2FwaW5nLlxuICB2YXIgZW50aXR5TWFwID0ge1xuICAgIGVzY2FwZToge1xuICAgICAgJyYnOiAnJmFtcDsnLFxuICAgICAgJzwnOiAnJmx0OycsXG4gICAgICAnPic6ICcmZ3Q7JyxcbiAgICAgICdcIic6ICcmcXVvdDsnLFxuICAgICAgXCInXCI6ICcmI3gyNzsnLFxuICAgICAgJy8nOiAnJiN4MkY7J1xuICAgIH1cbiAgfTtcbiAgZW50aXR5TWFwLnVuZXNjYXBlID0gXy5pbnZlcnQoZW50aXR5TWFwLmVzY2FwZSk7XG5cbiAgLy8gUmVnZXhlcyBjb250YWluaW5nIHRoZSBrZXlzIGFuZCB2YWx1ZXMgbGlzdGVkIGltbWVkaWF0ZWx5IGFib3ZlLlxuICB2YXIgZW50aXR5UmVnZXhlcyA9IHtcbiAgICBlc2NhcGU6ICAgbmV3IFJlZ0V4cCgnWycgKyBfLmtleXMoZW50aXR5TWFwLmVzY2FwZSkuam9pbignJykgKyAnXScsICdnJyksXG4gICAgdW5lc2NhcGU6IG5ldyBSZWdFeHAoJygnICsgXy5rZXlzKGVudGl0eU1hcC51bmVzY2FwZSkuam9pbignfCcpICsgJyknLCAnZycpXG4gIH07XG5cbiAgLy8gRnVuY3Rpb25zIGZvciBlc2NhcGluZyBhbmQgdW5lc2NhcGluZyBzdHJpbmdzIHRvL2Zyb20gSFRNTCBpbnRlcnBvbGF0aW9uLlxuICBfLmVhY2goWydlc2NhcGUnLCAndW5lc2NhcGUnXSwgZnVuY3Rpb24obWV0aG9kKSB7XG4gICAgX1ttZXRob2RdID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgICBpZiAoc3RyaW5nID09IG51bGwpIHJldHVybiAnJztcbiAgICAgIHJldHVybiAoJycgKyBzdHJpbmcpLnJlcGxhY2UoZW50aXR5UmVnZXhlc1ttZXRob2RdLCBmdW5jdGlvbihtYXRjaCkge1xuICAgICAgICByZXR1cm4gZW50aXR5TWFwW21ldGhvZF1bbWF0Y2hdO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gSWYgdGhlIHZhbHVlIG9mIHRoZSBuYW1lZCBwcm9wZXJ0eSBpcyBhIGZ1bmN0aW9uIHRoZW4gaW52b2tlIGl0O1xuICAvLyBvdGhlcndpc2UsIHJldHVybiBpdC5cbiAgXy5yZXN1bHQgPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7XG4gICAgaWYgKG9iamVjdCA9PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgICB2YXIgdmFsdWUgPSBvYmplY3RbcHJvcGVydHldO1xuICAgIHJldHVybiBfLmlzRnVuY3Rpb24odmFsdWUpID8gdmFsdWUuY2FsbChvYmplY3QpIDogdmFsdWU7XG4gIH07XG5cbiAgLy8gQWRkIHlvdXIgb3duIGN1c3RvbSBmdW5jdGlvbnMgdG8gdGhlIFVuZGVyc2NvcmUgb2JqZWN0LlxuICBfLm1peGluID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgZWFjaChfLmZ1bmN0aW9ucyhvYmopLCBmdW5jdGlvbihuYW1lKXtcbiAgICAgIHZhciBmdW5jID0gX1tuYW1lXSA9IG9ialtuYW1lXTtcbiAgICAgIF8ucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBhcmdzID0gW3RoaXMuX3dyYXBwZWRdO1xuICAgICAgICBwdXNoLmFwcGx5KGFyZ3MsIGFyZ3VtZW50cyk7XG4gICAgICAgIHJldHVybiByZXN1bHQuY2FsbCh0aGlzLCBmdW5jLmFwcGx5KF8sIGFyZ3MpKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gR2VuZXJhdGUgYSB1bmlxdWUgaW50ZWdlciBpZCAodW5pcXVlIHdpdGhpbiB0aGUgZW50aXJlIGNsaWVudCBzZXNzaW9uKS5cbiAgLy8gVXNlZnVsIGZvciB0ZW1wb3JhcnkgRE9NIGlkcy5cbiAgdmFyIGlkQ291bnRlciA9IDA7XG4gIF8udW5pcXVlSWQgPSBmdW5jdGlvbihwcmVmaXgpIHtcbiAgICB2YXIgaWQgPSArK2lkQ291bnRlciArICcnO1xuICAgIHJldHVybiBwcmVmaXggPyBwcmVmaXggKyBpZCA6IGlkO1xuICB9O1xuXG4gIC8vIEJ5IGRlZmF1bHQsIFVuZGVyc2NvcmUgdXNlcyBFUkItc3R5bGUgdGVtcGxhdGUgZGVsaW1pdGVycywgY2hhbmdlIHRoZVxuICAvLyBmb2xsb3dpbmcgdGVtcGxhdGUgc2V0dGluZ3MgdG8gdXNlIGFsdGVybmF0aXZlIGRlbGltaXRlcnMuXG4gIF8udGVtcGxhdGVTZXR0aW5ncyA9IHtcbiAgICBldmFsdWF0ZSAgICA6IC88JShbXFxzXFxTXSs/KSU+L2csXG4gICAgaW50ZXJwb2xhdGUgOiAvPCU9KFtcXHNcXFNdKz8pJT4vZyxcbiAgICBlc2NhcGUgICAgICA6IC88JS0oW1xcc1xcU10rPyklPi9nXG4gIH07XG5cbiAgLy8gV2hlbiBjdXN0b21pemluZyBgdGVtcGxhdGVTZXR0aW5nc2AsIGlmIHlvdSBkb24ndCB3YW50IHRvIGRlZmluZSBhblxuICAvLyBpbnRlcnBvbGF0aW9uLCBldmFsdWF0aW9uIG9yIGVzY2FwaW5nIHJlZ2V4LCB3ZSBuZWVkIG9uZSB0aGF0IGlzXG4gIC8vIGd1YXJhbnRlZWQgbm90IHRvIG1hdGNoLlxuICB2YXIgbm9NYXRjaCA9IC8oLileLztcblxuICAvLyBDZXJ0YWluIGNoYXJhY3RlcnMgbmVlZCB0byBiZSBlc2NhcGVkIHNvIHRoYXQgdGhleSBjYW4gYmUgcHV0IGludG8gYVxuICAvLyBzdHJpbmcgbGl0ZXJhbC5cbiAgdmFyIGVzY2FwZXMgPSB7XG4gICAgXCInXCI6ICAgICAgXCInXCIsXG4gICAgJ1xcXFwnOiAgICAgJ1xcXFwnLFxuICAgICdcXHInOiAgICAgJ3InLFxuICAgICdcXG4nOiAgICAgJ24nLFxuICAgICdcXHQnOiAgICAgJ3QnLFxuICAgICdcXHUyMDI4JzogJ3UyMDI4JyxcbiAgICAnXFx1MjAyOSc6ICd1MjAyOSdcbiAgfTtcblxuICB2YXIgZXNjYXBlciA9IC9cXFxcfCd8XFxyfFxcbnxcXHR8XFx1MjAyOHxcXHUyMDI5L2c7XG5cbiAgLy8gSmF2YVNjcmlwdCBtaWNyby10ZW1wbGF0aW5nLCBzaW1pbGFyIHRvIEpvaG4gUmVzaWcncyBpbXBsZW1lbnRhdGlvbi5cbiAgLy8gVW5kZXJzY29yZSB0ZW1wbGF0aW5nIGhhbmRsZXMgYXJiaXRyYXJ5IGRlbGltaXRlcnMsIHByZXNlcnZlcyB3aGl0ZXNwYWNlLFxuICAvLyBhbmQgY29ycmVjdGx5IGVzY2FwZXMgcXVvdGVzIHdpdGhpbiBpbnRlcnBvbGF0ZWQgY29kZS5cbiAgXy50ZW1wbGF0ZSA9IGZ1bmN0aW9uKHRleHQsIGRhdGEsIHNldHRpbmdzKSB7XG4gICAgdmFyIHJlbmRlcjtcbiAgICBzZXR0aW5ncyA9IF8uZGVmYXVsdHMoe30sIHNldHRpbmdzLCBfLnRlbXBsYXRlU2V0dGluZ3MpO1xuXG4gICAgLy8gQ29tYmluZSBkZWxpbWl0ZXJzIGludG8gb25lIHJlZ3VsYXIgZXhwcmVzc2lvbiB2aWEgYWx0ZXJuYXRpb24uXG4gICAgdmFyIG1hdGNoZXIgPSBuZXcgUmVnRXhwKFtcbiAgICAgIChzZXR0aW5ncy5lc2NhcGUgfHwgbm9NYXRjaCkuc291cmNlLFxuICAgICAgKHNldHRpbmdzLmludGVycG9sYXRlIHx8IG5vTWF0Y2gpLnNvdXJjZSxcbiAgICAgIChzZXR0aW5ncy5ldmFsdWF0ZSB8fCBub01hdGNoKS5zb3VyY2VcbiAgICBdLmpvaW4oJ3wnKSArICd8JCcsICdnJyk7XG5cbiAgICAvLyBDb21waWxlIHRoZSB0ZW1wbGF0ZSBzb3VyY2UsIGVzY2FwaW5nIHN0cmluZyBsaXRlcmFscyBhcHByb3ByaWF0ZWx5LlxuICAgIHZhciBpbmRleCA9IDA7XG4gICAgdmFyIHNvdXJjZSA9IFwiX19wKz0nXCI7XG4gICAgdGV4dC5yZXBsYWNlKG1hdGNoZXIsIGZ1bmN0aW9uKG1hdGNoLCBlc2NhcGUsIGludGVycG9sYXRlLCBldmFsdWF0ZSwgb2Zmc2V0KSB7XG4gICAgICBzb3VyY2UgKz0gdGV4dC5zbGljZShpbmRleCwgb2Zmc2V0KVxuICAgICAgICAucmVwbGFjZShlc2NhcGVyLCBmdW5jdGlvbihtYXRjaCkgeyByZXR1cm4gJ1xcXFwnICsgZXNjYXBlc1ttYXRjaF07IH0pO1xuXG4gICAgICBpZiAoZXNjYXBlKSB7XG4gICAgICAgIHNvdXJjZSArPSBcIicrXFxuKChfX3Q9KFwiICsgZXNjYXBlICsgXCIpKT09bnVsbD8nJzpfLmVzY2FwZShfX3QpKStcXG4nXCI7XG4gICAgICB9XG4gICAgICBpZiAoaW50ZXJwb2xhdGUpIHtcbiAgICAgICAgc291cmNlICs9IFwiJytcXG4oKF9fdD0oXCIgKyBpbnRlcnBvbGF0ZSArIFwiKSk9PW51bGw/Jyc6X190KStcXG4nXCI7XG4gICAgICB9XG4gICAgICBpZiAoZXZhbHVhdGUpIHtcbiAgICAgICAgc291cmNlICs9IFwiJztcXG5cIiArIGV2YWx1YXRlICsgXCJcXG5fX3ArPSdcIjtcbiAgICAgIH1cbiAgICAgIGluZGV4ID0gb2Zmc2V0ICsgbWF0Y2gubGVuZ3RoO1xuICAgICAgcmV0dXJuIG1hdGNoO1xuICAgIH0pO1xuICAgIHNvdXJjZSArPSBcIic7XFxuXCI7XG5cbiAgICAvLyBJZiBhIHZhcmlhYmxlIGlzIG5vdCBzcGVjaWZpZWQsIHBsYWNlIGRhdGEgdmFsdWVzIGluIGxvY2FsIHNjb3BlLlxuICAgIGlmICghc2V0dGluZ3MudmFyaWFibGUpIHNvdXJjZSA9ICd3aXRoKG9ianx8e30pe1xcbicgKyBzb3VyY2UgKyAnfVxcbic7XG5cbiAgICBzb3VyY2UgPSBcInZhciBfX3QsX19wPScnLF9faj1BcnJheS5wcm90b3R5cGUuam9pbixcIiArXG4gICAgICBcInByaW50PWZ1bmN0aW9uKCl7X19wKz1fX2ouY2FsbChhcmd1bWVudHMsJycpO307XFxuXCIgK1xuICAgICAgc291cmNlICsgXCJyZXR1cm4gX19wO1xcblwiO1xuXG4gICAgdHJ5IHtcbiAgICAgIHJlbmRlciA9IG5ldyBGdW5jdGlvbihzZXR0aW5ncy52YXJpYWJsZSB8fCAnb2JqJywgJ18nLCBzb3VyY2UpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGUuc291cmNlID0gc291cmNlO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG5cbiAgICBpZiAoZGF0YSkgcmV0dXJuIHJlbmRlcihkYXRhLCBfKTtcbiAgICB2YXIgdGVtcGxhdGUgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gcmVuZGVyLmNhbGwodGhpcywgZGF0YSwgXyk7XG4gICAgfTtcblxuICAgIC8vIFByb3ZpZGUgdGhlIGNvbXBpbGVkIGZ1bmN0aW9uIHNvdXJjZSBhcyBhIGNvbnZlbmllbmNlIGZvciBwcmVjb21waWxhdGlvbi5cbiAgICB0ZW1wbGF0ZS5zb3VyY2UgPSAnZnVuY3Rpb24oJyArIChzZXR0aW5ncy52YXJpYWJsZSB8fCAnb2JqJykgKyAnKXtcXG4nICsgc291cmNlICsgJ30nO1xuXG4gICAgcmV0dXJuIHRlbXBsYXRlO1xuICB9O1xuXG4gIC8vIEFkZCBhIFwiY2hhaW5cIiBmdW5jdGlvbiwgd2hpY2ggd2lsbCBkZWxlZ2F0ZSB0byB0aGUgd3JhcHBlci5cbiAgXy5jaGFpbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBfKG9iaikuY2hhaW4oKTtcbiAgfTtcblxuICAvLyBPT1BcbiAgLy8gLS0tLS0tLS0tLS0tLS0tXG4gIC8vIElmIFVuZGVyc2NvcmUgaXMgY2FsbGVkIGFzIGEgZnVuY3Rpb24sIGl0IHJldHVybnMgYSB3cmFwcGVkIG9iamVjdCB0aGF0XG4gIC8vIGNhbiBiZSB1c2VkIE9PLXN0eWxlLiBUaGlzIHdyYXBwZXIgaG9sZHMgYWx0ZXJlZCB2ZXJzaW9ucyBvZiBhbGwgdGhlXG4gIC8vIHVuZGVyc2NvcmUgZnVuY3Rpb25zLiBXcmFwcGVkIG9iamVjdHMgbWF5IGJlIGNoYWluZWQuXG5cbiAgLy8gSGVscGVyIGZ1bmN0aW9uIHRvIGNvbnRpbnVlIGNoYWluaW5nIGludGVybWVkaWF0ZSByZXN1bHRzLlxuICB2YXIgcmVzdWx0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NoYWluID8gXyhvYmopLmNoYWluKCkgOiBvYmo7XG4gIH07XG5cbiAgLy8gQWRkIGFsbCBvZiB0aGUgVW5kZXJzY29yZSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIgb2JqZWN0LlxuICBfLm1peGluKF8pO1xuXG4gIC8vIEFkZCBhbGwgbXV0YXRvciBBcnJheSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIuXG4gIGVhY2goWydwb3AnLCAncHVzaCcsICdyZXZlcnNlJywgJ3NoaWZ0JywgJ3NvcnQnLCAnc3BsaWNlJywgJ3Vuc2hpZnQnXSwgZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciBtZXRob2QgPSBBcnJheVByb3RvW25hbWVdO1xuICAgIF8ucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgb2JqID0gdGhpcy5fd3JhcHBlZDtcbiAgICAgIG1ldGhvZC5hcHBseShvYmosIGFyZ3VtZW50cyk7XG4gICAgICBpZiAoKG5hbWUgPT0gJ3NoaWZ0JyB8fCBuYW1lID09ICdzcGxpY2UnKSAmJiBvYmoubGVuZ3RoID09PSAwKSBkZWxldGUgb2JqWzBdO1xuICAgICAgcmV0dXJuIHJlc3VsdC5jYWxsKHRoaXMsIG9iaik7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gQWRkIGFsbCBhY2Nlc3NvciBBcnJheSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIuXG4gIGVhY2goWydjb25jYXQnLCAnam9pbicsICdzbGljZSddLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIG1ldGhvZCA9IEFycmF5UHJvdG9bbmFtZV07XG4gICAgXy5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiByZXN1bHQuY2FsbCh0aGlzLCBtZXRob2QuYXBwbHkodGhpcy5fd3JhcHBlZCwgYXJndW1lbnRzKSk7XG4gICAgfTtcbiAgfSk7XG5cbiAgXy5leHRlbmQoXy5wcm90b3R5cGUsIHtcblxuICAgIC8vIFN0YXJ0IGNoYWluaW5nIGEgd3JhcHBlZCBVbmRlcnNjb3JlIG9iamVjdC5cbiAgICBjaGFpbjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9jaGFpbiA9IHRydWU7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gRXh0cmFjdHMgdGhlIHJlc3VsdCBmcm9tIGEgd3JhcHBlZCBhbmQgY2hhaW5lZCBvYmplY3QuXG4gICAgdmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3dyYXBwZWQ7XG4gICAgfVxuXG4gIH0pO1xuXG59KS5jYWxsKHRoaXMpO1xuIl19
;