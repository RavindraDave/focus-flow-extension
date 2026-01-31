# LogViewer Testing Guide

## Setup

1. **Build the extension**:
   ```bash
   npm run build
   ```

2. **Load in Chrome**:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

3. **Open Options Page**:
   - Right-click extension icon → Options
   - OR click extension icon → Settings gear
   - OR navigate to `chrome-extension://[your-id]/options.html`

## Testing the LogViewer

### Step 1: Access the Debug Tab

The Debug Logs tab is **only visible in development mode**. To test:

1. Verify you're in development:
   - Check `process.env.NODE_ENV === 'development'`
   - In production builds, this tab won't appear

2. In the options page sidebar, look for:
   - **"Debug Logs"** tab with a debug icon
   - Should be below "Data & Config"

### Step 2: Generate Test Logs

Navigate between tabs to generate logs:

1. Click **Dashboard** → Log entry created
2. Click **Timer Settings** → Log entry created
3. Click **Blocking Rules** → Log entry created
4. Each click logs: `Tab changed { from: 'X', to: 'Y' }`

### Step 3: View Logs

In the Debug Logs tab:

1. **Log Display**:
   - Terminal-style black background
   - Green text (monospace font)
   - Color-coded log levels:
     - DEBUG: Gray
     - INFO: Blue
     - WARN: Yellow
     - ERROR: Red

2. **Log Format**:
   ```
   [HH:MM:SS.mmm] LEVEL [Component] Message {"data": "json"}
   ```

### Step 4: Test Filters

#### Filter by Level:
1. Select "Debug" from Level dropdown
2. Select "Info" - should show only INFO logs
3. Select "All" - shows everything

#### Filter by Component:
1. Select "OptionsApp" from Component dropdown
2. Should only show logs from OptionsApp component
3. Select "All" - shows all components

### Step 5: Test Features

#### Auto-Refresh:
1. Check "Auto-refresh" checkbox
2. Navigate tabs in another window/tab
3. Logs should update automatically every second

#### Refresh:
1. Click "Refresh" button
2. Logs reload from logger instance

#### Export:
1. Click "Export" button
2. Downloads JSON file: `focus-flow-logs-[timestamp].json`
3. Open file - should contain array of log entries

#### Clear:
1. Click "Clear" button
2. All logs removed
3. Stats should show 0 for all levels

### Step 6: Check Stats

Bottom of the page shows badges:
- "X Debug" - count of debug logs
- "X Info" - count of info logs
- "X Warn" - count of warnings
- "X Error" - count of errors

## Adding More Test Logs

### Method 1: Add to existing components

Edit `src/options/App.tsx`:

```typescript
import { createLogger } from '../utils/logger';

const log = createLogger('ComponentName');

// In your function:
log.debug('Debug message', { data: 123 });
log.info('User action', { action: 'click', target: 'button' });
log.warn('Warning occurred', { context: 'validation' });
log.error('Error occurred', new Error('Test error'), { userId: 123 });
```

### Method 2: Test in browser console

Open browser console and run:

```javascript
// Access the logger (if exposed globally for testing)
const { createLogger } = await import('./utils/logger.js');
const log = createLogger('TestComponent');

log.info('Test log from console');
log.warn('Warning from console');
log.error('Error from console', new Error('Test'));
```

## Expected Results

### ✅ Success Criteria

1. **Tab Navigation Logging**:
   - Each tab click generates log entry
   - Log shows previous and current tab
   - Logs appear in Debug tab immediately (or within 1 second if auto-refresh)

2. **Filtering**:
   - Level filter shows only selected level
   - Component filter shows only selected component
   - "All" options show everything

3. **Features**:
   - Auto-refresh updates logs every second
   - Export downloads valid JSON file
   - Clear removes all logs
   - Stats update correctly

4. **UI**:
   - Terminal-style appearance
   - Color-coded levels
   - Readable timestamps
   - Scrollable log area (500px height)

### ❌ Troubleshooting

**Debug tab not visible**:
- Check if `process.env.NODE_ENV === 'development'`
- In production builds, tab is hidden
- Rebuild with `npm run dev` for development mode

**No logs appearing**:
- Check browser console for errors
- Verify logger is imported correctly
- Try adding manual log: `log.info('Test')`

**Logs not updating**:
- Click "Refresh" button
- Enable "Auto-refresh"
- Check if logger instance is singleton

**Export not working**:
- Check browser's download permissions
- Look in Downloads folder
- Verify JSON contains logs array

## Advanced Testing

### Performance Testing

1. Generate many logs:
```typescript
for (let i = 0; i < 100; i++) {
  log.info(`Test log ${i}`, { index: i });
}
```

2. Check:
   - UI remains responsive
   - Filtering works quickly
   - Export completes successfully

### Persistence Testing

1. Enable persistence (optional):
```typescript
import { logger } from './utils/logger';
logger.setPersistence(true);
```

2. Generate logs
3. Reload extension
4. Check if logs persist (if enabled)

### Multi-Component Testing

1. Create loggers in multiple components:
   - OptionsApp
   - Dashboard
   - BlockerEngine
   - TimerEngine

2. Generate logs from each
3. Use component filter to view separately

## Production Behavior

In production (`NODE_ENV=production`):

1. Debug tab **hidden** (not accessible)
2. Only WARN and ERROR logs collected
3. No console output (except errors)
4. Minimal performance overhead
5. Logs still in memory (last 1000)
6. Can be exported if needed for debugging

## Manual Testing Checklist

- [ ] Debug tab visible in development mode
- [ ] Tab navigation generates logs
- [ ] Logs display with correct formatting
- [ ] Level filter works (Debug, Info, Warn, Error, All)
- [ ] Component filter works
- [ ] Auto-refresh updates logs every second
- [ ] Refresh button reloads logs
- [ ] Export downloads valid JSON file
- [ ] Clear button removes all logs
- [ ] Stats badges show correct counts
- [ ] Scrolling works in log area
- [ ] Color coding correct for each level
- [ ] Timestamps formatted correctly
- [ ] JSON data displayed for structured logs
- [ ] Error messages shown for errors

## Screenshots

Take screenshots of:
1. Debug tab in sidebar (development mode)
2. LogViewer with multiple logs
3. Filtered view (by level)
4. Filtered view (by component)
5. Stats badges
6. Exported JSON file

## Next Steps

After successful testing:

1. Add more loggers to other components
2. Replace console.log statements
3. Update tests to use logger
4. Document logger usage for team
5. Consider publishing as NPM package

## Support

If issues persist:
1. Check browser console for errors
2. Verify all files committed and pushed
3. Rebuild extension: `npm run build`
4. Clear Chrome extension cache
5. Reload extension in `chrome://extensions/`
