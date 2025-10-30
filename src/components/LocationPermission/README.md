# LocationPermission Component

A modal component that prompts users to allow location access after successful login. This component requests the user's geolocation and saves it to the database.

## Features

- Beautiful, non-intrusive modal design
- Requests browser geolocation permission
- Handles various error scenarios (permission denied, unavailable, timeout)
- Allows users to skip location permission for now
- Automatically saves location to database when granted
- Error messages for better user feedback

## Usage

The component is automatically displayed by `App.jsx` after successful login if the user hasn't previously granted location access.

```jsx
import LocationPermission from './components/LocationPermission';

<LocationPermission onLocationGranted={handleLocationGranted} />
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `onLocationGranted` | Function | Callback function called when user grants or skips location permission |

## API Integration

The component calls two endpoints:

1. **POST /update-location** - Saves the user's latitude and longitude to the database
2. **GET /location-status** - Checks if user already has location saved (used by parent component)

## Browser Compatibility

Uses the standard `navigator.geolocation` API, which is supported in all modern browsers.

## Notes

- Location is stored with high accuracy settings
- Users can skip location permission, but it may affect their ability to find nearby matches
- The modal is dismissed automatically after successful location save

