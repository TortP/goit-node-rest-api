import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// Mock должен быть ДО импорта контроллера
const mockLoginUser = jest.fn();
jest.unstable_mockModule('../services/authServices.js', () => ({
  loginUser: mockLoginUser,
}));

// Импорт контроллера ПОСЛЕ мока
const { login } = await import('../controllers/authControllers.js');

describe('Login Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {
        email: 'test@example.com',
        password: 'password123',
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('should return status code 200 on successful login', async () => {
    // Arrange
    const mockResult = {
      token: 'mock-jwt-token',
      user: {
        email: 'test@example.com',
        subscription: 'starter',
      },
    };
    mockLoginUser.mockResolvedValue(mockResult);

    // Act
    await login(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('should return token in response', async () => {
    // Arrange
    const mockResult = {
      token: 'mock-jwt-token-12345',
      user: {
        email: 'test@example.com',
        subscription: 'pro',
      },
    };
    mockLoginUser.mockResolvedValue(mockResult);

    // Act
    await login(req, res, next);

    // Assert
    expect(res.json).toHaveBeenCalled();
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall).toHaveProperty('token');
    expect(typeof jsonCall.token).toBe('string');
  });

  test('should return user object with email and subscription fields of String type', async () => {
    // Arrange
    const mockResult = {
      token: 'mock-jwt-token',
      user: {
        email: 'user@test.com',
        subscription: 'business',
      },
    };
    mockLoginUser.mockResolvedValue(mockResult);

    // Act
    await login(req, res, next);

    // Assert
    expect(res.json).toHaveBeenCalled();
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall).toHaveProperty('user');
    expect(jsonCall.user).toHaveProperty('email');
    expect(jsonCall.user).toHaveProperty('subscription');
    expect(typeof jsonCall.user.email).toBe('string');
    expect(typeof jsonCall.user.subscription).toBe('string');
  });

  test('should return 401 for invalid credentials', async () => {
    // Arrange
    mockLoginUser.mockResolvedValue(null);

    // Act
    await login(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Email or password is wrong',
    });
  });

  test('should call next with error on exception', async () => {
    // Arrange
    const error = new Error('Database error');
    mockLoginUser.mockRejectedValue(error);

    // Act
    await login(req, res, next);

    // Assert
    expect(next).toHaveBeenCalledWith(error);
  });
});
