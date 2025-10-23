/** @jsx h */
/** @jsxFrag Fragment */
import { h, Fragment } from '@worker-render/core/jsx-runtime';
import { defineRoute, type Route } from '@worker-render/core';

// Navbar component - basePath is injected during build
const Navbar = ({ currentPath, basePath = '' }: { currentPath: string; basePath?: string }) => {
  return (
    <nav class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <a href={basePath ? `${basePath}/` : '/'} class="text-xl font-semibold text-gray-900">
              WorkerRender
            </a>
          </div>

          {/* Desktop navigation */}
          <div class="hidden md:flex items-center space-x-8">
            <a
              href={basePath ? `${basePath}/` : '/'}
              class={currentPath === '/' || currentPath === `${basePath}/`
                ? "inline-flex items-center px-1 pt-1 border-b-2 border-indigo-500 text-sm font-medium text-gray-900"
                : "inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"}
            >
              Home
            </a>
            <a
              href={basePath ? `${basePath}/about.html` : '/about.html'}
              class={currentPath === '/about.html' || currentPath.includes('about')
                ? "inline-flex items-center px-1 pt-1 border-b-2 border-indigo-500 text-sm font-medium text-gray-900"
                : "inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"}
            >
              About
            </a>
            <a
              href={basePath ? `${basePath}/features.html` : '/features.html'}
              class={currentPath === '/features.html' || currentPath.includes('features')
                ? "inline-flex items-center px-1 pt-1 border-b-2 border-indigo-500 text-sm font-medium text-gray-900"
                : "inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"}
            >
              Features
            </a>
            <a
              href="https://github.com/aaronshaf/WorkerRender"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              title="View on GitHub"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
              </svg>
            </a>
          </div>

          {/* Mobile menu button */}
          <div class="flex items-center md:hidden">
            <button
              id="mobile-menu-btn"
              type="button"
              class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span class="sr-only">Open main menu</span>
              {/* Hamburger icon */}
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div class="md:hidden hidden" id="mobile-menu">
        <div class="px-2 pt-2 pb-3 space-y-1">
          <a
            href={basePath ? `${basePath}/` : '/'}
            class={currentPath === '/' || currentPath === `${basePath}/`
              ? "block pl-3 pr-4 py-2 border-l-4 border-indigo-500 text-base font-medium text-indigo-700 bg-indigo-50"
              : "block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300"}
          >
            Home
          </a>
          <a
            href={basePath ? `${basePath}/about.html` : '/about.html'}
            class={currentPath === '/about.html' || currentPath.includes('about')
              ? "block pl-3 pr-4 py-2 border-l-4 border-indigo-500 text-base font-medium text-indigo-700 bg-indigo-50"
              : "block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300"}
          >
            About
          </a>
          <a
            href={basePath ? `${basePath}/features.html` : '/features.html'}
            class={currentPath === '/features.html' || currentPath.includes('features')
              ? "block pl-3 pr-4 py-2 border-l-4 border-indigo-500 text-base font-medium text-indigo-700 bg-indigo-50"
              : "block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300"}
          >
            Features
          </a>
          <a
            href="https://github.com/aaronshaf/WorkerRender"
            target="_blank"
            rel="noopener noreferrer"
            class="block pl-3 pr-4 py-2 text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50"
          >
            <span class="flex items-center">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
              </svg>
              GitHub
            </span>
          </a>
        </div>
      </div>

    </nav>
  );
};

type HomeData = {
  message: string;
  count: number;
};

const homeRoute = defineRoute<HomeData>({
  path: '/',
  async loader() {
    return {
      message: 'WorkerRender',
      count: 0
    };
  },
  Page({ data, url, basePath = '' }) {
    return (
      <>
        <Navbar currentPath={url.pathname} basePath={basePath} />
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div class="max-w-3xl">
            <h1 class="text-3xl font-bold text-gray-900">{data.message}</h1>
            <p class="mt-4 text-lg text-gray-600">
              A universal TSX framework for building server-side rendered applications with Service Worker support.
            </p>

            <div class="mt-8">
              <h2 class="text-2xl font-semibold text-gray-900">Interactive Counter</h2>
              <p class="mt-2 text-gray-600">
                State persists in sessionStorage across page loads.
              </p>

              <div class="mt-6 bg-white border border-gray-200 rounded-lg p-6">
                <div class="flex items-center justify-center space-x-4">
                  <button
                    id="decrement"
                    class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Decrement
                  </button>
                  <span id="count" class="text-3xl font-bold text-gray-900 w-16 text-center">{data.count}</span>
                  <button
                    id="increment"
                    class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Increment
                  </button>
                </div>
                <script dangerouslySetInnerHTML={{__html: `
                  (function() {
                    let count = sessionStorage.getItem('counter')
                      ? parseInt(sessionStorage.getItem('counter'), 10)
                      : ${data.count};

                    const countEl = document.getElementById('count');
                    const decrementBtn = document.getElementById('decrement');
                    const incrementBtn = document.getElementById('increment');

                    countEl.textContent = count;

                    decrementBtn.addEventListener('click', () => {
                      count--;
                      countEl.textContent = count;
                      sessionStorage.setItem('counter', count);
                    });

                    incrementBtn.addEventListener('click', () => {
                      count++;
                      countEl.textContent = count;
                      sessionStorage.setItem('counter', count);
                    });
                  })();
                `}} />
              </div>
            </div>
          </div>
        </main>
      </>
    );
  },
  title: (d) => d.message
});

type AboutData = {
  info: string;
};

const aboutRoute = defineRoute<AboutData>({
  path: '/about.html',
  async loader() {
    return {
      info: 'WorkerRender is a universal TSX framework built on Hono with Service Worker rendering.'
    };
  },
  Page({ data, url, basePath = '' }) {
    return (
      <>
        <Navbar currentPath={url.pathname} basePath={basePath} />
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div class="max-w-3xl">
            <h1 class="text-3xl font-bold text-gray-900">About</h1>
            <p class="mt-4 text-lg text-gray-600">{data.info}</p>

            <div class="mt-8 bg-white border border-gray-200 rounded-lg p-6">
              <h2 class="text-xl font-semibold text-gray-900">Built With</h2>
              <dl class="mt-4 space-y-4">
                <div>
                  <dt class="font-medium text-gray-900">TSX + Hono</dt>
                  <dd class="mt-1 text-gray-600">Type-safe JSX templates with Hono's universal web framework</dd>
                </div>
                <div>
                  <dt class="font-medium text-gray-900">Service Worker</dt>
                  <dd class="mt-1 text-gray-600">Client-side rendering for instant navigation without network requests</dd>
                </div>
                <div>
                  <dt class="font-medium text-gray-900">Idiomorph</dt>
                  <dd class="mt-1 text-gray-600">Smart DOM morphing preserves input state and scroll position</dd>
                </div>
                <div>
                  <dt class="font-medium text-gray-900">IndexedDB</dt>
                  <dd class="mt-1 text-gray-600">Stale-while-revalidate caching for instant page loads</dd>
                </div>
              </dl>
            </div>
          </div>
        </main>
      </>
    );
  },
  title: () => 'About'
});

type DocsData = {
  title: string;
};

const docsRoute = defineRoute<DocsData>({
  path: '/features.html',
  async loader() {
    return {
      title: 'Features'
    };
  },
  Page({ data, url, basePath = '' }) {
    return (
      <>
        <Navbar currentPath={url.pathname} basePath={basePath} />
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div class="max-w-3xl">
            <h1 class="text-3xl font-bold text-gray-900">{data.title}</h1>
            <div class="mt-8 bg-white border border-gray-200 rounded-lg p-6">
              <ul class="space-y-3">
                <li class="flex items-start">
                  <span class="flex-shrink-0 h-6 w-6 text-indigo-600">•</span>
                  <span class="ml-3 text-gray-600"><strong class="text-gray-900">Server-side rendering</strong> with Hono's universal runtime</span>
                </li>
                <li class="flex items-start">
                  <span class="flex-shrink-0 h-6 w-6 text-indigo-600">•</span>
                  <span class="ml-3 text-gray-600"><strong class="text-gray-900">Service Worker rendering</strong> for client-side navigation</span>
                </li>
                <li class="flex items-start">
                  <span class="flex-shrink-0 h-6 w-6 text-indigo-600">•</span>
                  <span class="ml-3 text-gray-600"><strong class="text-gray-900">Progressive enhancement</strong> with inline JavaScript</span>
                </li>
                <li class="flex items-start">
                  <span class="flex-shrink-0 h-6 w-6 text-indigo-600">•</span>
                  <span class="ml-3 text-gray-600"><strong class="text-gray-900">TypeScript support</strong> with full type safety</span>
                </li>
              </ul>
            </div>

            <div class="mt-8 bg-white border border-gray-200 rounded-lg p-6">
              <h2 class="text-xl font-semibold text-gray-900">Resources</h2>
              <p class="mt-2 text-gray-600">
                View the <a href="https://github.com/aaronshaf/WorkerRender" class="text-indigo-600 hover:text-indigo-500" target="_blank" rel="noopener noreferrer">GitHub repository</a> for additional documentation and examples.
              </p>
            </div>
          </div>
        </main>
      </>
    );
  },
  title: () => 'Features'
});

export const routes: Route[] = [homeRoute, aboutRoute, docsRoute];
