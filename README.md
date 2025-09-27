# gnome-caps-apps-toggle
Gnome extension that makes Caps Lock key open application grid and adds a button to the top bar that also opens the application grid.

The extension removes all existing Caps Lock XKB options and sets `caps:hyper` which remaps Caps Lock to Hyper.
If you already use Hyper for shortcuts, then this extension will break those.

## Installation
```sh
mkdir -p ~/.local/share/gnome-shell/extensions/
cd ~/.local/share/gnome-shell/extensions/
git clone git@github.com:fishie/gnome-caps-apps-toggle.git caps-apps-toggle@rishie.rishie.se
glib-compile-schemas caps-apps-toggle@rishie.rishie.se/schemas/
```
