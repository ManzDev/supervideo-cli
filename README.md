# supervideo-cli

A simple cli command for video tasks like as split, join and show info from videos.

![supervideo-cli](https://github.com/ManzDev/supervideo-cli/raw/master/docs/supervideo-cli.png)

### Installation

```bash
npm install -g supervideo-cli
```

### Usage

```bash
// Read video.txt and split video.mp4 into specified chunks
supervideo split video.mp4
```

On previous example, you need a text file with same filename but `.txt` extension with fragments (`video.txt` in this example):

```bash
00:00 01:32 part1.mp4
01:32 22:14 part2.mp4
```

```bash
// Joins a, b & c into one file: out.mp4
supervideo concat a.mp4 b.mp4 c.mp4 -o out.mp4

// Create timelapse from video
supervideo timelapse vid.mp4 --speed 0.05 -o fast.mp4

// Info from video
supervideo info video.mp4
```

### Credits

Uses ffmpeg, a brilliant software for work with video: http://ffmpeg.org/