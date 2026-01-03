# API Integration Layer

This directory contains the complete API integration layer for the SpellHire frontend application. It provides a production-ready, typed, and well-organized system for making API calls with features like caching, error handling, and authentication management.

## 📁 Directory Structure

```
src/lib/api/
├── client.ts              # Core HTTP client with retry logic
├── services/              # Service modules for different API domains
│   ├── auth.ts           # Authentication service
│   └── profile.ts        # Profile management service
├── index.ts              # Main entry point with all exports
└── README.md             # This file

src/lib/hooks/
├── useApi.ts             # Core API hooks with stale-while-revalidate
├── useAuth.ts            # Authentication-specific hooks
└── useProfile.ts         # Profile-specific hooks

src/contexts/
└── AuthContext.tsx       # Authentication context and provider

src/types/
└── api.ts                # Complete TypeScript type definitions

src/lib/config/
└── api.ts                # API configuration and constants
```

## 🚀 Features

### ✅ **Production-Ready HTTP Client**
- Automatic retry logic with exponential backoff
- Request timeout handling
- Network error detection and recovery
- Abort controller support for request cancellation

### ✅ **Stale-While-Revalidate Caching**
- Intelligent caching with configurable stale times
- Automatic cache invalidation
- Optimistic updates support
- Memory-efficient cache management

### ✅ **Comprehensive TypeScript Support**
- Full type safety from backend schemas
- Auto-generated types matching Pydantic models
- IntelliSense support for all API calls
- Compile-time error checking

### ✅ **Authentication Management**
- JWT token handling with automatic refresh
- Secure token storage in localStorage
- Session management across devices
- Google OAuth integration

### ✅ **Error Handling**
- Centralized error management
- User-friendly error messages
- Retry logic for transient failures
- Network error recovery

### ✅ **Developer Experience**
- Consistent API patterns
- Reusable hooks for common operations
- Comprehensive documentation
- Easy testing and mocking

## 📖 Usage Examples

### Basic API Call

```typescript
import { useApi } from '@/lib/api';

function UserProfile() {
  const { data, isLoading, error, refetch } = useApi(
    () => ProfileService.getCandidateProfile(),
    'candidate_profile',
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
    }
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>{data?.candidate.first_name} {data?.candidate.last_name}</h1>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### Authentication

```typescript
import { useAuth, AuthProvider } from '@/lib/api';

function App() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}

function LoginForm() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await login(email, password, UserType.CANDIDATE);
      // User is now logged in
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
      />
      <input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### Mutations

```typescript
import { useUpdateCandidateProfile } from '@/lib/api';

function ProfileEditor() {
  const { mutate, isLoading, error } = useUpdateCandidateProfile();

  const handleUpdate = async (profileData) => {
    try {
      await mutate({ candidate: profileData });
      // Profile updated successfully
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  return (
    <form onSubmit={handleUpdate}>
      {/* Form fields */}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Updating...' : 'Update Profile'}
      </button>
    </form>
  );
}
```

### Optimistic Updates

```typescript
import { useOptimisticProfileUpdate } from '@/lib/api';

function ProfileForm() {
  const { updateCandidateProfileOptimistic } = useOptimisticProfileUpdate();

  const handleFieldChange = (field, value) => {
    // Update UI immediately
    updateCandidateProfileOptimistic({ [field]: value });
    
    // API call happens in background
    // If it fails, the UI will revert automatically
  };

  return (
    <form>
      <input 
        onChange={(e) => handleFieldChange('first_name', e.target.value)}
      />
    </form>
  );
}
```

## 🔧 Configuration

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_DEBUG=true
NEXT_PUBLIC_MOCK_API=false
```

### API Configuration

```typescript
import { API_CONFIG } from '@/lib/config/api';

// Customize API settings
const customConfig = {
  ...API_CONFIG,
  TIMEOUT: 15000, // 15 seconds
  RETRIES: 5,
  DEFAULT_STALE_TIME: 10 * 60 * 1000, // 10 minutes
};
```

## 🧪 Testing

### Mock API for Testing

```typescript
// __mocks__/api.ts
export const mockApiClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

// In your tests
import { mockApiClient } from '@/__mocks__/api';

beforeEach(() => {
  jest.clearAllMocks();
});

test('should fetch user profile', async () => {
  mockApiClient.get.mockResolvedValue({
    data: { candidate: { first_name: 'John', last_name: 'Doe' } }
  });

  // Your test code here
});
```

## 🔒 Security

### Token Management
- Tokens are stored securely in localStorage
- Automatic token refresh before expiration
- Secure token transmission via headers
- Token cleanup on logout

### Error Handling
- No sensitive data in error messages
- Proper HTTP status code handling
- Network error detection
- Rate limiting support

## 📊 Performance

### Caching Strategy
- **Stale-While-Revalidate**: Show cached data immediately, fetch fresh data in background
- **Configurable Cache Times**: Different cache durations for different data types
- **Memory Management**: Automatic cleanup of expired cache entries
- **Optimistic Updates**: Immediate UI updates with background sync

### Network Optimization
- **Request Deduplication**: Prevent duplicate requests
- **Retry Logic**: Automatic retry for failed requests
- **Timeout Handling**: Prevent hanging requests
- **Abort Controllers**: Cancel requests when components unmount

## 🚀 Future Enhancements

### Planned Features
- [ ] Real-time updates with WebSocket integration
- [ ] Offline support with service workers
- [ ] Advanced caching with IndexedDB
- [ ] Request/response interceptors
- [ ] API analytics and monitoring
- [ ] GraphQL support
- [ ] File upload handling
- [ ] Pagination helpers

### Extensibility
The API layer is designed to be easily extensible:

1. **Add New Services**: Create new service modules in `services/`
2. **Add New Hooks**: Create specialized hooks in `hooks/`
3. **Add New Types**: Extend types in `types/api.ts`
4. **Add New Endpoints**: Update configuration in `config/api.ts`

## 📚 API Reference

### Core Hooks

#### `useApi<T>(apiCall, cacheKey, options)`
Main hook for data fetching with caching.

**Parameters:**
- `apiCall`: Function that returns a Promise<ApiResponse<T>>
- `cacheKey`: Unique string for cache identification
- `options`: Configuration object

**Returns:**
- `data`: Cached or fresh data
- `isLoading`: Loading state
- `error`: Error state
- `refetch`: Function to manually refetch
- `mutate`: Function for optimistic updates

#### `useMutation<T, V>(mutationFn, options)`
Hook for mutations (POST, PUT, DELETE).

**Parameters:**
- `mutationFn`: Function that performs the mutation
- `options`: Success/error callbacks

**Returns:**
- `mutate`: Function to trigger mutation
- `isLoading`: Loading state
- `error`: Error state
- `data`: Response data

### Authentication Hooks

#### `useAuth()`
Main authentication hook providing login, logout, and user state.

#### `useCurrentUser()`
Hook to get current user information.

#### `useIsAuthenticated()`
Hook to check authentication status.

### Profile Hooks

#### `useCandidateProfile()`
Hook to fetch candidate profile data.

#### `useUpdateCandidateProfile()`
Hook to update candidate profile.

#### `useProfileCompletion()`
Hook to get profile completion status and percentage.

## 🤝 Contributing

When adding new API endpoints:

1. **Add Types**: Update `types/api.ts` with new request/response types
2. **Add Service**: Create or update service modules in `services/`
3. **Add Hooks**: Create specialized hooks in `hooks/`
4. **Update Config**: Add endpoint URLs to `config/api.ts`
5. **Add Tests**: Write tests for new functionality
6. **Update Docs**: Update this README with new features

## 📞 Support

For questions or issues with the API integration layer:

1. Check the [API Documentation](../../../API_DOCUMENTATION.md)
2. Review the [Backend Schemas](../../../backend/app/schemas/)
3. Check existing issues in the repository
4. Create a new issue with detailed information

---

*This API integration layer is designed to be robust, type-safe, and developer-friendly. It follows modern React patterns and provides excellent performance through intelligent caching and optimistic updates.*
