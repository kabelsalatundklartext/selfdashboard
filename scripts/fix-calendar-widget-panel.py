from pathlib import Path

path = Path(__file__).resolve().parents[1] / "plugins" / "calendar" / "index.tsx"
text = path.read_text(encoding="utf-8")

old_placeholder = """            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>
              {t('openDay')}
            </motion empty>
            </div>"""

# try without motion typo
old_placeholder = """            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>
              {t('openDay')}
            </div>"""

new_panel = """            <WidgetDayEventsPanel
              locale={locale}
              day={selectedDay}
              events={selectedDayEvents}
              canAdd={writableCalendars.length > 0}
              onAdd={openNewEvent}
              onClickEvent={openEventFromMonth}
              onOpenDayPopup={() => openDayPopup(selectedDay)}
            />"""

if old_placeholder not in text:
    raise SystemExit("placeholder block not found")
text = text.replace(old_placeholder, new_panel, 1)

text = text.replace("      <motion header />\n", "", 1)
text = text.replace("    </motion empty>\n", "", 1)

path.write_text(text, encoding="utf-8", newline="\n")
print("ok")
