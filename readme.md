# Paparazzi

For taking shots of pairs of UI components and visually diffing them, to check for changes between two copies of the same page eg. your local copy vs live.

## Setup

Mac OSX:
```
brew install cairo
brew install pkg-config
npm install
```

Ubuntu:
```
apt-get install pkg-config
apt-get install libcairo2-dev
apt-get install libjpeg-dev

```

## Adding components
In config.json, add an object for each new component. 'className' must match the component's CSS class.

## Running
```
node start
```

Passes and fails will be output to the command line.

## Output
In the shots folder, there will be a subfolder for each component, containing shots for local, live and a diff between the two.
