/**
 * Volume plugin widget — served from /app/plugins/custom/<id>/widget.js
 * Uses window.SelfDashboard (React + registerPlugin). No image rebuild.
 */
(function (SD) {
  var React = SD.React
  var registerPlugin = SD.registerPlugin

  var meta = {
    id: 'myplugin',
    name: 'My Volume Plugin',
    description: 'Loaded from the mounted plugins folder.',
    version: '1.0.0',
    author: 'You',
    category: 'utility',
    icon: '✨',
    defaultLayout: { w: 3, h: 3, minW: 2, minH: 2 },
  }

  function Widget(props) {
    return React.createElement(
      'div',
      {
        style: {
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text)',
          fontSize: '13px',
        },
      },
      'Hello from volume plugin',
    )
  }

  registerPlugin(meta, { Widget: Widget }, { replace: true })
})(window.SelfDashboard)
