const { St, Clutter } = imports.gi;
const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;
const Main = imports.ui.main;

let tempLabel;
let intervalId;

const CONFIG = {
    normal: {
        temp: 40,
        color: 'green'
    },
    warning: {
        temp: 70,
        color: 'white'
    },
    critical: {
        color: 'red'
    }
};

function getColor(tempValue) {
    if (tempValue <= CONFIG.normal.temp) {
        return CONFIG.normal.color;
    } else if (tempValue <= CONFIG.warning.temp) {
        return CONFIG.warning.color;
    } else {
        return CONFIG.critical.color;
    }
}

function setLabelColor(tempText) {
    let firstTemp = parseFloat(tempText.split(' | ')[0]);
    let color = 'gray';

    if (!isNaN(firstTemp)) {
        color = getColor(firstTemp);
    }

    tempLabel.set_style(`color: ${color};`);
}

function getTemperatures() {
    try {
        let [ok, out] = GLib.spawn_command_line_sync('sensors');
        if (!ok) return 'N/A';

        let text = out.toString();
        let lines = text.split('\n');
        let temps = [];

        for (let line of lines) {
            if (line.startsWith('Core')) {
                let match = line.match(/\+[\d.]+°C/);
                if (match) {
                    temps.push(match[0].replace('+', ''));
                }
            }
        }

        return temps.join(' | ') || 'N/A';
    } catch (e) {
        return 'Error';
    }
}

function updateTemps() {
    let temps = getTemperatures();
    setLabelColor(temps);
    tempLabel.set_text(temps);
    return true;
}

function init() {}

function enable() {
    tempLabel = new St.Label({
        text: 'Loading...',
        y_align: Clutter.ActorAlign.CENTER
    });

    Main.panel._rightBox.insert_child_at_index(tempLabel, 0);
    intervalId = Mainloop.timeout_add_seconds(3, updateTemps);
    updateTemps();
}

function disable() {
    if (intervalId) {
        Mainloop.source_remove(intervalId);
        intervalId = null;
    }

    if (tempLabel) {
        Main.panel._rightBox.remove_child(tempLabel);
        tempLabel = null;
    }
}
