/**
 * complete
 * Bash Completion for node.js
 */

var fs = require('fs')
  , path = require('path')
  , os = require('os')
  , join = path.join;

var home = process.env.HOME
  , dir = join(home, '.node-completion')
  , rc = os.type() === 'Darwin'
      ? '.bash_profile'
      : '.bashrc'
  , bashrc = join(home, rc);

var commands
  , program
  , opt;

/**
 * Completion
 */

function complete(options) {
  if (process.platform === 'win32') return;

  options = options || {};
  commands = options.commands || exports.commands;
  opt = options.options || exports.options;
  program = options.program || exports.program;

  // Ensure scripts
  ensure(program || getName());

  var argv = process.argv
    , index = argv.indexOf('--compgen')
    , words;

  if (~index) {
    // Cannot allow any output:
    process.on('uncaughtException', function() {
      ;
    });

    words = argv.slice(index + 1);
    completeWords(words);

    // Explanation:
    // If something asynchronous is happening in a matching
    // function, we need to stop the module from doing anything
    // further. This gets caught by the uncaughtException listener
    // and stops anymore synchronous code from being executed.
    // Yes, it is hacky.
    throw 'stop';
  }
}

function completeWords(words) {
  var cur = words[words.length-1]
    , prev = words[words.length-2]
    , com = commands
    , command = com
    , i = 1
    , out;

  // Reduce
  while (com = com[words[i++]]) {
    command = com;
  }

  if (typeof command === 'function') {
    // A dynamic match.
    command(words, prev, cur);
  } else if (typeof command === 'object') {
    // Already matched
    if (i === words.length + 1) {
      echo(cur);
      return;
    }

    // A static/dynamic match.
    if (command.__exec__) {
      command.__exec__(words, prev, cur);
    }

    // A static match.
    out = match(cur, command);
    if (out) {
      echo(out);
      return;
    }

    // Resolve position-independent options.
    // Possibly add dynamic behavior here.
    out = match(cur, opt);
    if (out) {
      echo(out);
      return;
    }
  } else {
    process.exit(1);
  }
}

/**
 * Ensure Completion Scripts
 * and Startup Code
 */

function ensure(program) {
  // These don't need to be done in serial,
  // so we can make this function more
  // efficient by going async.
  ensure.rc();
  ensure.script(program);
}

ensure.rc = function() {
  fs.readFile(bashrc, 'utf8', function(err, data) {
    data = data || '';
    if ((err && err.code === 'ENOENT')
        || !~data.indexOf('# Node Completion')) {
      data += source;
      fs.writeFile(bashrc, data);
    }
  });
};

ensure.script = function(program) {
  var file = join(dir, program)
    , data = completion;

  data = data.replace(/{{NAME}}/g, program);

  fs.mkdir(dir, 0755, function() {
    fs.stat(file, function(err) {
      if (err && err.code === 'ENOENT') {
        fs.writeFile(file, data);
      }
    });
  });
};

/**
 * Get Script Name
 */

function getName() {
  var argv = process.argv.slice()
    , file;

  if (argv[0].slice(-4) === 'node') argv.shift();

  file = argv[0];

  try {
    // Attempt to resolve symlinks
    while (fs.lstatSync(file).isSymbolicLink()) {
      file = fs.readlinkSync(file);
    }
  } catch (e) {
    file = argv[0];
  }

  return path.basename(file);
}

/**
 * Bash
 */

var source = [
  '',
  '# {{{',
  '# Node Completion - Auto-generated, do not touch.',
  'shopt -s progcomp',
  'for f in $(command ls ~/.node-completion); do',
  '  f="$HOME/.node-completion/$f"',
  '  test -f "$f" && . "$f"',
  'done',
  '# }}}',
  ''
].join('\n');

var completion = [
  '__{{NAME}}_comp() {',
  '  COMPREPLY=()',
  '  COMPREPLY=($({{NAME}} --compgen "${COMP_WORDS[@]}"))',
  '  return 0',
  '}',
  '',
  'complete -F __{{NAME}}_comp {{NAME}} 2>/dev/null',
  ''
].join('\n');

/**
 * Helpers
 */

function match(key, list) {
  if (!list) return;
  if (!Array.isArray(list)) list = Object.keys(list);

  var out = []
    , l = list.length
    , i = 0;

  for (; i < l; i++) {
    if (list[i] === '__exec__') continue;
    if (list[i].indexOf(key) === 0) out.push(list[i]);
  }

  return out.join(' ');
}

function echo(text) {
  if (!text) return;
  process.stdout.write(text + '\n');
}

function output(key, list) {
  return echo(match(key, list));
}

/**
 * Callback Style
 * Expose a lower level
 * method of doing things.
 */

/**
 * list
 * An array of possible matches.
 */

complete.list = [];

/*
 * init
 * Initalize the autocomplete module.
 */

complete.init = function() {
  if (process.platform === 'win32') return;

  ensure(getName());

  var argc = process.argv.indexOf('--compgen');

  if (~argc) {
    process.on('uncaughtException', function() {
      ;
    });

    compgen(process.argv, argc, complete.callback);

    // If there are still any callbacks on the event loop,
    // we need to kill the current stack immediately.
    throw 'stop';
  }

  return this;
};

/**
 * add
 * Echo an array or string.
 */

complete.add = function(opt) {
  if (Array.isArray(opt)) {
    opt = opt.join(' ');
  }
  // The line feed `echo` adds acts as a
  // delimiter, so we can always add matches.
  echo(opt + '');
};

/**
 * callback
 * The user's callback
 */

complete.callback = function(last, args, list) {
  ;
};

/**
 * compgen
 * compgen is somewhat of the program entry point when actively used by
 * a completion listener. it will accept a list of arguments and return
 * a list of potential matches for the last partial argument provided.
 */

function compgen(argl, i, callback) {
  var arglist = argl[argl.length-1]
    , reducedlist = []
    , lastSelection;

  if (complete.list.length > 0) {
    complete.list.forEach(function(item) {
      if (~item.indexOf(arglist)) {
        reducedlist.push(item);
      }
    });
  }

  echo(reducedlist.join('\n'));

  if (complete.callback) {
    lastSelection = argl[argl.length-2];
    complete.callback(lastSelection, arglist, reducedlist);
  }
}

/**
 * Expose
 */

exports = complete;

exports.match = match;
exports.echo = echo;
exports.output = output;

module.exports = exports;
