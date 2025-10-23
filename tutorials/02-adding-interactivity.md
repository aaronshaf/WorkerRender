# Adding Interactivity

Learn how to add client-side JavaScript to make your pages interactive.

## Inline Scripts

The simplest way to add interactivity is with inline scripts in your page components.

### Example: Counter

Update your route in `src/app.routes.tsx`:

```tsx
defineRoute({
  path: '/',
  async loader() {
    return { count: 0 };
  },
  Page({ data }) {
    return (
      <main>
        <h1>Counter</h1>
        <button id="increment">
          Count: <span id="count">{data.count}</span>
        </button>

        <script dangerouslySetInnerHTML={{__html: `
          let count = ${data.count};
          const button = document.getElementById('increment');
          const display = document.getElementById('count');

          button.addEventListener('click', () => {
            count++;
            display.textContent = count;
          });
        `}} />
      </main>
    );
  },
  title: () => 'Counter'
})
```

### How It Works

1. The script runs when the page first loads
2. When you navigate to another page and back, the script re-executes automatically
3. State resets to the initial `data.count` value

## Reusing Logic with Modules

For complex interactions, you can extract logic into separate modules and call them from inline scripts:

Create `src/counter.ts`:

```ts
export function setupCounter(elementId: string, initialValue: number) {
  let count = parseInt(sessionStorage.getItem('count') || String(initialValue));
  const button = document.getElementById(elementId);

  if (button) {
    const display = button.querySelector('#count');
    if (display) {
      display.textContent = String(count);
    }

    button.addEventListener('click', () => {
      count++;
      if (display) {
        display.textContent = String(count);
      }
      sessionStorage.setItem('count', String(count));
    });
  }
}
```

Then import and use it in an inline script:

```tsx
Page({ data }) {
  return (
    <main>
      <button id="increment">
        Count: <span id="count">0</span>
      </button>

      <script type="module" dangerouslySetInnerHTML={{__html: `
        import { setupCounter } from '/src/counter.js';
        setupCounter('increment', ${data.count});
      `}} />
    </main>
  );
}
```

**Note:** When using the Vite plugin (as shown in Tutorial 01), the Service Worker and client navigation are auto-generated for you. The inline scripts will automatically re-execute after navigation.

## Best Practices

1. **Keep it simple** - Inline scripts work great for small interactions
2. **Use storage APIs** - `sessionStorage` for per-tab state, `localStorage` for persistent state
3. **Listen for navigation** - Use the `workerrender:navigate` event to reinitialize scripts
4. **Progressive enhancement** - Your app should work without JavaScript

## Next Steps

- [Custom Layouts](./03-custom-layouts.md) - Add CSS and customize your HTML
- [How It Works](../HOW_IT_WORKS.md) - Understand the architecture
