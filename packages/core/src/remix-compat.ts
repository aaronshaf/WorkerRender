/**
 * Remix-compatible patterns for WorkerRender
 * Makes it easier for Remix users to migrate
 */

import type { LoaderCtx } from './routes';

/**
 * Action function for handling form submissions (Remix-style)
 */
export type ActionFunction<T = any> = (args: ActionFunctionArgs) => Promise<T> | T;

export interface ActionFunctionArgs {
  request: Request;
  params: Record<string, string>;
  context?: any;
}

export interface ActionResult {
  data?: any;
  error?: Error;
  redirect?: string;
  status?: number;
}

/**
 * Meta function for SEO (Remix-style)
 */
export type MetaFunction<T = any> = (args: MetaFunctionArgs<T>) => MetaDescriptor[];

export interface MetaFunctionArgs<T = any> {
  data: T;
  params: Record<string, string>;
  location: Location;
  matches?: RouteMatch[];
}

export interface MetaDescriptor {
  title?: string;
  name?: string;
  property?: string;
  content?: string;
  charset?: string;
  httpEquiv?: string;
}

export interface Location {
  pathname: string;
  search: string;
  hash: string;
  state?: any;
  key?: string;
}

/**
 * Route match for nested routes
 */
export interface RouteMatch {
  id: string;
  pathname: string;
  params: Record<string, string>;
  data: any;
  handle?: any;
}

/**
 * Enhanced Route definition with Remix-compatible features
 */
export interface RemixRoute<LoaderData = any, ActionData = any> {
  path: string;

  // Data loading
  loader?: (args: LoaderFunctionArgs) => Promise<LoaderData> | LoaderData;

  // Form handling
  action?: ActionFunction<ActionData>;

  // Component
  Component?: (props: RouteComponentProps<LoaderData, ActionData>) => any;

  // SEO
  meta?: MetaFunction<LoaderData>;

  // Error handling
  ErrorBoundary?: (props: { error: Error }) => any;
  CatchBoundary?: (props: { caught: any }) => any;

  // Nested routes
  children?: RemixRoute[];

  // Layout component for nested routes
  Layout?: (props: { children: any }) => any;

  // Route handle (for breadcrumbs, etc.)
  handle?: any;

  // Whether to revalidate on navigation
  shouldRevalidate?: ShouldRevalidateFunction;
}

export interface LoaderFunctionArgs {
  request: Request;
  params: Record<string, string>;
  context?: any;
}

export interface RouteComponentProps<LoaderData = any, ActionData = any> {
  loaderData: LoaderData;
  actionData?: ActionData;
  params: Record<string, string>;
  location: Location;
  outlet?: any; // For nested routes
}

export type ShouldRevalidateFunction = (args: {
  currentUrl: URL;
  currentParams: Record<string, string>;
  nextUrl: URL;
  nextParams: Record<string, string>;
  formMethod?: string;
  formAction?: string;
  formEncType?: string;
  formData?: FormData;
  actionResult?: any;
  defaultShouldRevalidate: boolean;
}) => boolean;

/**
 * Loader helpers (Remix-style)
 */

/**
 * Create a JSON response (like Remix's json())
 */
export function json<T>(
  data: T,
  init?: ResponseInit
): Response {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');

  return new Response(JSON.stringify(data), {
    ...init,
    headers
  });
}

/**
 * Create a redirect response (like Remix's redirect())
 */
export function redirect(
  url: string,
  init?: ResponseInit
): Response {
  const status = init?.status || 302;
  const headers = new Headers(init?.headers);
  headers.set('Location', url);

  return new Response(null, {
    ...init,
    status,
    headers
  });
}

/**
 * Defer data for streaming (simplified version of Remix's defer())
 */
export function defer<T extends Record<string, any>>(
  data: T,
  init?: ResponseInit
): DeferredData<T> {
  return new DeferredData(data, init);
}

export class DeferredData<T extends Record<string, any>> {
  constructor(
    public data: T,
    public init?: ResponseInit
  ) {}

  /**
   * Resolve all promises in the data
   */
  async resolveAll(): Promise<T> {
    const resolved: any = {};

    for (const [key, value] of Object.entries(this.data)) {
      if (value instanceof Promise) {
        resolved[key] = await value;
      } else {
        resolved[key] = value;
      }
    }

    return resolved as T;
  }
}

/**
 * Form helpers
 */

/**
 * Parse form data from request (like Remix's await request.formData())
 */
export async function parseFormData(request: Request): Promise<FormData> {
  const contentType = request.headers.get('Content-Type') || '';

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const text = await request.text();
    const params = new URLSearchParams(text);
    const formData = new FormData();

    params.forEach((value, key) => {
      formData.append(key, value);
    });

    return formData;
  }

  if (contentType.includes('multipart/form-data')) {
    return await request.formData();
  }

  // Try parsing as FormData anyway
  return await request.formData();
}

/**
 * Get search params from request
 */
export function getSearchParams(request: Request): URLSearchParams {
  const url = new URL(request.url);
  return url.searchParams;
}

/**
 * Session helpers (simplified)
 */

export interface Session {
  get(key: string): any;
  set(key: string, value: any): void;
  unset(key: string): void;
  has(key: string): boolean;
}

export interface SessionStorage {
  getSession(cookieHeader?: string | null): Promise<Session>;
  commitSession(session: Session): Promise<string>;
  destroySession(session: Session): Promise<string>;
}

/**
 * Create a cookie-based session storage (simplified)
 */
export function createCookieSessionStorage({
  cookie
}: {
  cookie: CookieOptions;
}): SessionStorage {
  return {
    async getSession(cookieHeader) {
      // Parse cookie and return session
      const data = parseCookie(cookieHeader || '', cookie.name || 'session');
      return createSession(data);
    },

    async commitSession(session) {
      // Serialize session to cookie string
      const data = (session as any).data;
      return serializeCookie(cookie.name || 'session', data, cookie);
    },

    async destroySession() {
      // Return cookie with max-age=0
      return serializeCookie(cookie.name || 'session', '', {
        ...cookie,
        maxAge: 0
      });
    }
  };
}

interface CookieOptions {
  name?: string;
  domain?: string;
  path?: string;
  sameSite?: 'lax' | 'strict' | 'none';
  secure?: boolean;
  httpOnly?: boolean;
  maxAge?: number;
  expires?: Date;
}

function createSession(data: any): Session {
  const sessionData = data || {};

  return {
    get(key: string) {
      return sessionData[key];
    },
    set(key: string, value: any) {
      sessionData[key] = value;
    },
    unset(key: string) {
      delete sessionData[key];
    },
    has(key: string) {
      return key in sessionData;
    },
    data: sessionData // Internal use
  } as any;
}

function parseCookie(cookieHeader: string, name: string): any {
  const cookies = cookieHeader.split(';').map(c => c.trim());
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const [key, value] = cookie.split('=');
    if (key === name) {
      try {
        return JSON.parse(decodeURIComponent(value));
      } catch {
        return {};
      }
    }
  }
  return {};
}

function serializeCookie(name: string, value: any, options: CookieOptions): string {
  const encoded = encodeURIComponent(JSON.stringify(value));
  let cookie = `${name}=${encoded}`;

  if (options.domain) cookie += `; Domain=${options.domain}`;
  if (options.path) cookie += `; Path=${options.path}`;
  if (options.maxAge) cookie += `; Max-Age=${options.maxAge}`;
  if (options.expires) cookie += `; Expires=${options.expires.toUTCString()}`;
  if (options.httpOnly) cookie += '; HttpOnly';
  if (options.secure) cookie += '; Secure';
  if (options.sameSite) cookie += `; SameSite=${options.sameSite}`;

  return cookie;
}

/**
 * Links component helpers (for prefetching)
 */
export interface LinkProps {
  to: string;
  prefetch?: 'none' | 'intent' | 'render' | 'viewport';
  replace?: boolean;
  state?: any;
  preventScrollReset?: boolean;
  relative?: 'route' | 'path';
  reloadDocument?: boolean;
  children: any;
  className?: string;
  style?: any;
}

/**
 * Convert Remix route to WorkerRender route
 */
export function adaptRemixRoute<T>(remixRoute: RemixRoute<T>): any {
  return {
    path: remixRoute.path,

    async loader(ctx: LoaderCtx) {
      if (!remixRoute.loader) return {};

      const request = new Request(ctx.url.toString(), {
        headers: ctx.headers
      });

      return await remixRoute.loader({
        request,
        params: ctx.params,
        context: {}
      });
    },

    Page(props: any) {
      if (!remixRoute.Component) return null;

      const location: Location = {
        pathname: props.url.pathname,
        search: props.url.search,
        hash: props.url.hash
      };

      return remixRoute.Component({
        loaderData: props.data,
        params: props.params,
        location
      });
    },

    title: remixRoute.meta ? (data: T) => {
      const location: Location = {
        pathname: '/',
        search: '',
        hash: ''
      };

      const metaTags = remixRoute.meta!({
        data,
        params: {},
        location
      });

      const titleTag = metaTags.find(m => m.title);
      return titleTag?.title || 'App';
    } : undefined
  };
}