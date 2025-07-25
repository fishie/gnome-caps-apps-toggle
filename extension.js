import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import Gio from 'gi://Gio';

const keybindingName = 'toggle-key';
const modifiedKeyboardSetting = 'modified-keyboard';
const capsOptionsSetting = 'caps-options';

const log = (message) => console.log(`[CapsAppsToggle] ${message}`);
const error = (message) => console.error(`[CapsAppsToggle] ${message}`);

export default class CapsAppsToggleExtension extends Extension {
    enable() {
        log('Extension enabled');
        this._setCapsLockToHyper();
        this._bindKey();
    }

    disable() {
        log('Extension disabled');
        this._unbindKey();
        this._restoreOriginalCapsLockBehavior();
    }

    _setCapsLockToHyper() {
        log('Setting Caps Lock to Hyper key');
        const inputSettings = new Gio.Settings({schema_id: 'org.gnome.desktop.input-sources'});
        const currentOptions = inputSettings.get_strv('xkb-options');
        log(`Current XKB options: ${currentOptions.join(', ')}`);

        const extensionSettings = this.getSettings();
        const wasModified = extensionSettings.get_boolean(modifiedKeyboardSetting);

        if (wasModified) {
            log("Found previously modified keyboard settings, checking stored options");
            const capsOptions = extensionSettings.get_strv(capsOptionsSetting);
            log(`Stored Caps options: ${capsOptions.join(', ')}`);
        } else {
            log("No previously modified keyboard settings found, using current options");
            const capsOptions = currentOptions.filter(opt => opt.startsWith('caps:'));
            log(`Current Caps options: ${capsOptions.join(', ')}`);
            extensionSettings.set_strv(capsOptionsSetting, capsOptions);
        }

        // Remove any existing caps lock options and add hyper
        const newOptions = currentOptions.filter(opt => !opt.startsWith('caps:'));
        newOptions.push('caps:hyper');
        log(`New XKB options: ${newOptions.join(', ')}`);
        inputSettings.set_strv('xkb-options', newOptions);
        extensionSettings.set_boolean(modifiedKeyboardSetting, true);
    }

    _restoreOriginalCapsLockBehavior() {
        log('Trying to restore original Caps Lock behavior');
        const inputSettings = new Gio.Settings({schema_id: 'org.gnome.desktop.input-sources'});
        const extensionSettings = this.getSettings();
        const wasModified = extensionSettings.get_boolean(modifiedKeyboardSetting);
        const capsOptions = extensionSettings.get_strv(capsOptionsSetting);

        if (wasModified) {
            log(`Restoring original Caps Lock settings: ${capsOptions.join(', ')}`);
            const currentOptions = inputSettings.get_strv('xkb-options');
            const newOptions = currentOptions.filter(opt => !opt.startsWith('caps:'));
            newOptions.push(...capsOptions);
            log(`New XKB options after restoration: ${newOptions.join(', ')}`);
            inputSettings.set_strv('xkb-options', newOptions);
            extensionSettings.set_boolean(modifiedKeyboardSetting, false);
        } else {
            error(`No Caps modifications found! Original Caps modifications: ${capsOptions.join(', ')}`);
        }
    }

    _bindKey() {
        log('Binding key for toggling apps overview');
        Main.wm.addKeybinding(
            keybindingName,
            this.getSettings(),
            Meta.KeyBindingFlags.NONE,
            Shell.ActionMode.ALL,
            this._toggleAppsOverview.bind(this)
        );
    }

    _unbindKey() {
        log('Unbinding key for toggling apps overview');
        Main.wm.removeKeybinding(keybindingName);
    }

    _toggleAppsOverview() {
        if (Main.overview.visible) {
            Main.overview.hide();
        } else {
            Main.overview.showApps();
        }
    }
}
