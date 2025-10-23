/**
 * Example admin route using Hono middleware
 *
 * This demonstrates how to use standard Hono middleware with WorkerRender routes.
 * Install Hono middleware packages as needed:
 * - pnpm add @hono/basic-auth
 * - pnpm add @hono/rate-limit
 */

/** @jsx h */
/** @jsxFrag Fragment */

import { h, Fragment } from '@worker-render/core';
import { defineRoute, useHonoMiddleware } from '@worker-render/core';

// Example of using Hono middleware (would need to be installed)
// import { basicAuth } from 'hono/basic-auth';
// import { logger } from 'hono/logger';
// import { cors } from 'hono/cors';

// For this example, we'll create simple inline middleware following Hono's pattern
const createLogger = () => {
  return async (c: any, next: () => Promise<void>) => {
    const start = Date.now();
    console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.url} - START`);

    await next();

    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.url} - ${duration}ms`);
  };
};

const createSimpleAuth = (username: string, password: string) => {
  return async (c: any, next: () => Promise<void>) => {
    // In a real app, check Authorization header or session
    const auth = c.req.header('authorization');

    // For demo, just check for a cookie
    const cookie = c.req.header('cookie');
    const hasAdminToken = cookie?.includes('admin-token=valid-admin-token');

    if (!hasAdminToken) {
      // Unauthorized - in real Hono middleware, you'd use c.status(401)
      throw new Response('Unauthorized', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"'
        }
      });
    }

    // Store user info in context
    c.set('user', { username: 'admin' });

    await next();
  };
};

interface AdminData {
  users: Array<{ id: string; name: string; email: string }>;
  stats: {
    totalUsers: number;
    activeToday: number;
    newThisWeek: number;
  };
}

export default defineRoute({
  path: '/admin',

  // Use Hono-compatible middleware
  middleware: [
    useHonoMiddleware(createLogger()),
    useHonoMiddleware(createSimpleAuth('admin', 'password'))

    // With actual Hono middleware packages:
    // useHonoMiddleware(logger()),
    // useHonoMiddleware(basicAuth({ username: 'admin', password: 'secret' })),
    // useHonoMiddleware(cors({ origin: 'https://example.com' }))
  ],

  loader: async (ctx) => {
    // This only runs if all middleware passes
    console.log('Loading admin data for:', ctx.url.pathname);

    // Mock data (in real app, fetch from database)
    return {
      users: [
        { id: '1', name: 'Alice Johnson', email: 'alice@example.com' },
        { id: '2', name: 'Bob Smith', email: 'bob@example.com' },
        { id: '3', name: 'Carol White', email: 'carol@example.com' }
      ],
      stats: {
        totalUsers: 142,
        activeToday: 89,
        newThisWeek: 12
      }
    };
  },

  Page: ({ data }) => (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-100 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900">Total Users</h3>
          <p className="text-3xl font-bold text-blue-600">{data.stats.totalUsers}</p>
        </div>
        <div className="bg-green-100 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-green-900">Active Today</h3>
          <p className="text-3xl font-bold text-green-600">{data.stats.activeToday}</p>
        </div>
        <div className="bg-purple-100 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-900">New This Week</h3>
          <p className="text-3xl font-bold text-purple-600">{data.stats.newThisWeek}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-xl font-semibold">Users</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.users.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                  <button className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Note about middleware */}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> This page uses Hono-compatible middleware:
        </p>
        <ul className="list-disc list-inside text-sm text-yellow-700 mt-2">
          <li>Logger middleware that tracks request duration</li>
          <li>Simple auth middleware (requires admin-token cookie)</li>
          <li>You can use any Hono middleware packages with <code>useHonoMiddleware()</code></li>
        </ul>
        <p className="text-sm text-yellow-700 mt-2">
          To test: Set cookie with <code>document.cookie = 'admin-token=valid-admin-token'</code> in console
        </p>
      </div>
    </div>
  ),

  title: () => 'Admin Dashboard'
});