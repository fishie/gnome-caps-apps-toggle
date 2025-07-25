import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import Gio from 'gi://Gio';
import St from 'gi://St';
import GObject from 'gi://GObject';

const KEYBINDING_NAME = 'toggle-key';
const MODIFIED_KEYBOARD_SETTING = 'modified-keyboard';
const CAPS_OPTIONS_SETTING = 'caps-options';
const INPUT_SOURCES_SCHEMA = 'org.gnome.desktop.input-sources';
const XKB_OPTIONS_KEY = 'xkb-options';
const CAPS_HYPER_OPTION = 'caps:hyper';

const log = (message) => console.log(`[CapsAppsToggle] ${message}`);
const error = (message) => console.error(`[CapsAppsToggle] ${message}`);

const AppsToggleButton = GObject.registerClass(class extends PanelMenu.Button {
    _init(extension) {
        super._init(0.0, 'Apps Toggle Button', false);
        this._extension = extension;

        // Create the button icon using a grid/apps icon
        this._icon = new St.Icon({
            icon_name: 'view-app-grid-symbolic',
            style_class: 'system-status-icon',
        });

        this.add_child(this._icon);

        // Connect the button click to toggle apps overview
        this.connect('button-press-event', () => this._extension._toggleAppsOverview());
    }
});

export default class CapsAppsToggleExtension extends Extension {
    enable() {
        log('Extension enabled');
        this._setCapsLockToHyper();
        this._bindKey();
        this._addTopBarButton();
    }

    disable() {
        log('Extension disabled');
        this._unbindKey();
        this._removeTopBarButton();
        this._restoreOriginalCapsLockBehavior();
    }

    _addTopBarButton() {
        log('Adding top bar button');
        this._button = new AppsToggleButton(this);

        // Add the button to the right side of the top bar
        // You can change 'right' to 'center' or 'left' if preferred
        Main.panel.addToStatusArea('apps-toggle-button', this._button, 0, 'right');
    }

    _removeTopBarButton() {
        log('Removing top bar button');
        if (this._button) {
            this._button.destroy();
            this._button = null;
        }
    }

    _setCapsLockToHyper() {
        log('Setting Caps Lock to Hyper key');
        const inputSettings = new Gio.Settings({ schema_id: INPUT_SOURCES_SCHEMA });
        const currentOptions = inputSettings.get_strv(XKB_OPTIONS_KEY);
        log(`Current XKB options: ${currentOptions.join(', ')}`);

        const extensionSettings = this.getSettings();
        const wasModified = extensionSettings.get_boolean(MODIFIED_KEYBOARD_SETTING);

        if (wasModified) {
            log("Found previously modified keyboard settings, checking stored options");
            const capsOptions = extensionSettings.get_strv(CAPS_OPTIONS_SETTING);
            log(`Stored Caps options: ${capsOptions.join(', ')}`);
        } else {
            log("No previously modified keyboard settings found, using current options");
            const capsOptions = currentOptions.filter(opt => opt.startsWith('caps:'));
            log(`Current Caps options: ${capsOptions.join(', ')}`);
            extensionSettings.set_strv(CAPS_OPTIONS_SETTING, capsOptions);
        }

        // Remove any existing caps lock options and add hyper
        const newOptions = currentOptions.filter(opt => !opt.startsWith('caps:'));
        newOptions.push(CAPS_HYPER_OPTION);
        log(`New XKB options: ${newOptions.join(', ')}`);
        inputSettings.set_strv(XKB_OPTIONS_KEY, newOptions);
        extensionSettings.set_boolean(MODIFIED_KEYBOARD_SETTING, true);
    }

    _restoreOriginalCapsLockBehavior() {
        log('Trying to restore original Caps Lock behavior');
        const extensionSettings = this.getSettings();
        const wasModified = extensionSettings.get_boolean(MODIFIED_KEYBOARD_SETTING);
        const capsOptions = extensionSettings.get_strv(CAPS_OPTIONS_SETTING);

        if (wasModified) {
            log(`Restoring original Caps Lock settings: ${capsOptions.join(', ')}`);
            const inputSettings = new Gio.Settings({schema_id: INPUT_SOURCES_SCHEMA});
            const currentOptions = inputSettings.get_strv(XKB_OPTIONS_KEY);
            const newOptions = currentOptions.filter(opt => !opt.startsWith('caps:'));
            newOptions.push(...capsOptions);
            log(`New XKB options after restoration: ${newOptions.join(', ')}`);
            inputSettings.set_strv(XKB_OPTIONS_KEY, newOptions);
            extensionSettings.set_boolean(MODIFIED_KEYBOARD_SETTING, false);
        } else {
            error(`No Caps modifications found! Original Caps modifications: ${capsOptions.join(', ')}`);
        }
    }

    _bindKey() {
        log('Binding key for toggling apps overview');
        Main.wm.addKeybinding(
            KEYBINDING_NAME,
            this.getSettings(),
            Meta.KeyBindingFlags.NONE,
            Shell.ActionMode.ALL,
            this._toggleAppsOverview.bind(this)
        );
    }

    _unbindKey() {
        log('Unbinding key for toggling apps overview');
        Main.wm.removeKeybinding(KEYBINDING_NAME);
    }

    _toggleAppsOverview() {
        if (Main.overview.visible) {
            Main.overview.hide();
        } else {
            Main.overview.showApps();
        }
    }
}
