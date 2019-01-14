#!/usr/bin/env node

const fs = require('fs');
const cmd = require('child_process');
const path = require('path');
const os = require('os');

const ffmpeg = require('ffmpeg-static');
const colors = require('colors');
const getopts = require('getopts');
const pbytes = require('pretty-bytes');

const options = getopts(process.argv.slice(3), {
  alias: {
    r: "render",
    h: "help",
    o: "output",
    s: "speed"
  },
  boolean: [ "r", "h" ],
  default: {
    speed: 0.02
  }
});

const command = process.argv[2];

const cmdSilent = {
  stdio: ['ignore', 'pipe', 'pipe']
};

// Syntax help
if (options.help || process.argv.length == 2) {
  console.log('Usage: ' + 'supervideo'.cyan + ' <option> <args>\n');
  console.log('Options:');
  console.log('   ', 'supervideo'.cyan, 'split'.green, '<original.mp4> [--render]', '\t\t\tSplit original input video into small video chunks.')
  console.log('   ', ' * Needs a text file (same name, .txt extension) with time fragments. Format: BEGINTIME ENDTIME FILENAME\n'.grey);
  console.log('   ', 'supervideo'.cyan, 'concat'.green, '<v1> <v2> ... -o <out.mp4> [--render]', '\tConcatenate multiple vids into one.');
  console.log('   ', 'supervideo'.cyan, 'timelapse'.green, '<video.mp4> --speed 0.02 -o <out.mp4>', '\tApply fast or slow motion to video. Less = more fast');
  console.log('   ', 'supervideo'.cyan, 'info'.green, '<video.mp4>', '\t\t\t\tShow video information');

  console.log('\nCommon options:');
  console.log('   --render'.yellow, '\tRe-encode entire video. More slow, but more accurate (youtube-friendly)');
  console.log('\nExamples:');
  console.log('   supervideo split video.mp4', '\t\t\t\t\tRead video.txt and split video.mp4 into specified chunks');
  console.log('   supervideo concat a.mp4 b.mp4 c.mp4 -o out.mp4', '\t\tJoins a, b & c into one file: out.mp4');
  console.log('   supervideo timelapse vid.mp4 --speed 0.05 -o fast.mp4', '\tCreate timelapse from vid.mp4');

  process.exit(0);
}

// Split video
if (command === 'split') {

  const source = options._[0];
  const datafile = source.substring(0, source.lastIndexOf('.')) + '.txt';

  const lines = fs.readFileSync(datafile, 'utf8').split(os.EOL);

  lines.forEach(e => {

    const args = [ `${ffmpeg.path} -i ${source}` ];

    if (!options.render)
      args.push('-vcodec copy -acodec copy');

    const [begin, end, ...fileparts] = e.split(' ');
    const filename = fileparts.join(' ');

    args.push(`-ss ${begin} -to ${end}`);
    args.push(`"${filename}"`);

    process.stdout.write('File ' + filename.cyan + '...');
    if (fs.existsSync(filename))
      console.log('Exists. ' + 'Skipping'.orange);
    else {
      try {
        const time = process.hrtime();
        cmd.execSync(args.join(' '), cmdSilent);
        let [s, ns] = process.hrtime(time);

        s = (s > 60 ? Math.round(s / 60) + 'min' : s + 'sec');
        console.log('Ok'.green, pbytes(fs.statSync(filename).size) + s);

      } catch (e) {
        console.log(`Error ${e.status}`.red, e.stderr.toString().split(os.EOL).slice(-3)[1]);
      }
    }

  });
}

// Concat video
if (command === 'concat' && options.output) {

  const args = [ `${ffmpeg.path}` ];

  const concatfile = options.output + '.txt';
  const data = options._.map(e => `file '${e}'`).join('\n');
  const sources = fs.writeFileSync(concatfile, data);

  args.push(`-f concat -safe 0 -i ${concatfile}`);

  if (!options.render)
    args.push('-c copy');

  args.push(options.output);

  cmd.execSync(args.join(' '), cmdSilent);
  fs.unlinkSync(concatfile);

}

// Time lapse
if (command === 'timelapse' && options.output) {

  const args = [ `${ffmpeg.path} -i ${options._[0]}` ];
  args.push(`-vf setpts=${options.speed}*PTS ${options.output}`);

  cmd.execSync(args.join(' '), cmdSilent);
}

// Info video
if (command === 'info') {

  cmd.exec(ffmpeg.path + ' -i "' + options._[0] + '"', (err, stdout, stderr) => {

    const duration = /Duration: ([\d\.:]+),/.exec(stderr);
    const regex = /Stream.+/g;
    const size = pbytes(fs.statSync(options._[0]).size);

    console.log('Size:'.yellow, size);

    if (duration)
      console.log('Duration:'.yellow, duration[1]);

    while ((res = regex.exec(stderr)) !== null) {
      const data = res[0].replace('Stream', 'Channel')
                         .replace('(und)', '')
                         .replace('(default)', '')
                         .replace(' Video', '\n Video'.green)
                         .replace(' Audio', '\n Audio'.magenta)
                         .replace(', ', '\n\t')
                         .replace('kb/s, ', 'kb/s\n\t');
      console.log(data);
    }

  });

}