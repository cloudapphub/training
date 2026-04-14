export const angularLessons = [
  {
    time: "Hour 1",
    title: "Angular Fundamentals â€” CLI, Project Structure & Components",
    concept: [
      "**Angular** is a full-featured, opinionated TypeScript framework for building enterprise-grade single-page applications (SPAs). Unlike React (library), Angular provides EVERYTHING out of the box: routing, forms, HTTP client, DI, testing, i18n, and build tooling. Angular 17+ introduced standalone components, signals, and deferred views â€” modernizing the entire developer experience.",
      "**Angular CLI** (`ng`) is the primary tool for scaffolding and managing projects. Install: `npm install -g @angular/cli`. Create: `ng new my-app --standalone --style=scss --routing`. Serve: `ng serve` (dev server on port 4200). Generate: `ng generate component user-list`, `ng generate service api/user`. Build: `ng build --configuration=production`. The CLI handles Webpack/esbuild configuration automatically.",
      "**Project structure:** `src/app/` contains your application code. `app.component.ts` is the root component. `app.config.ts` configures providers (standalone apps). `app.routes.ts` defines routing. `angular.json` configures build/test/serve options. `tsconfig.json` for TypeScript. `environment.ts` for environment-specific variables. Feature modules live in folders like `src/app/features/users/`.",
      "**Components** are the building blocks of Angular UIs. Each component has: (1) A TypeScript class (logic), (2) An HTML template (view), (3) CSS/SCSS styles (scoped). Decorator: `@Component({ selector: 'app-user', template: '...', styles: ['...'] })`. Standalone components (Angular 17+) don't need NgModules: `@Component({ standalone: true, imports: [CommonModule] })`.",
      "**Templates and Interpolation:** Use `{{ expression }}` for data binding in templates. Angular evaluates the expression and converts to string. Property binding: `[src]=\"imageUrl\"`. Event binding: `(click)=\"onClick()\"`. Two-way binding: `[(ngModel)]=\"name\"` (requires FormsModule). Angular 17+ introduced new control flow: `@if`, `@for`, `@switch` â€” replacing *ngIf, *ngFor, *ngSwitch.",
      "**Angular 17+ control flow syntax:** `@if (condition) { <p>Visible</p> } @else { <p>Hidden</p> }`. `@for (item of items; track item.id) { <li>{{ item.name }}</li> } @empty { <p>No items</p> }`. `@switch (status) { @case ('active') { <span>Active</span> } @default { <span>Other</span> } }`. The `track` clause in @for is REQUIRED â€” it replaces Angular's trackBy function for optimal DOM updates.",
    ],
    code: `// === Angular CLI Commands ===
// ng new task-manager --standalone --style=scss --routing
// ng generate component features/task-list
// ng generate service core/services/task
// ng generate guard core/guards/auth
// ng serve --open
// ng build --configuration=production

// === Root Component (app.component.ts) ===
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: \`
    <header class="navbar">
      <h1>{{ title }}</h1>
      <nav>
        <a routerLink="/tasks">Tasks</a>
        <a routerLink="/about">About</a>
      </nav>
    </header>
    <main>
      <router-outlet />
    </main>
  \`,
  styles: [\`
    .navbar { display: flex; justify-content: space-between; padding: 1rem; }
    nav a { margin-left: 1rem; text-decoration: none; }
  \`]
})
export class AppComponent {
  title = 'Task Manager';
}

// === Feature Component with Angular 17+ Control Flow ===
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Task {
  id: number;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule],
  template: \`
    <div class="task-list">
      <h2>My Tasks ({{ tasks().length }})</h2>

      <!-- Angular 17+ @if control flow -->
      @if (tasks().length > 0) {
        <!-- @for with required track clause -->
        @for (task of tasks(); track task.id) {
          <div class="task-card" [class.completed]="task.completed">
            <input type="checkbox"
                   [checked]="task.completed"
                   (change)="toggleTask(task.id)" />
            <span>{{ task.title }}</span>

            <!-- @switch for priority badge -->
            @switch (task.priority) {
              @case ('high') { <span class="badge high">High</span> }
              @case ('medium') { <span class="badge med">Medium</span> }
              @default { <span class="badge low">Low</span> }
            }

            <button (click)="deleteTask(task.id)">Delete</button>
          </div>
        }
      } @else {
        <p class="empty">No tasks yet. Add one above!</p>
      }
    </div>
  \`
})
export class TaskListComponent {
  // Signals (Angular 17+) â€” reactive state
  tasks = signal<Task[]>([
    { id: 1, title: 'Learn Angular', completed: false, priority: 'high' },
    { id: 2, title: 'Build a project', completed: false, priority: 'medium' },
    { id: 3, title: 'Deploy to prod', completed: false, priority: 'low' },
  ]);

  toggleTask(id: number) {
    this.tasks.update(tasks =>
      tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    );
  }

  deleteTask(id: number) {
    this.tasks.update(tasks => tasks.filter(t => t.id !== id));
  }
}`,
    practice: "Create a ProductListComponent that displays a list of products with name, price, and category. Use Angular 17+ @for with track, @if for empty state, and @switch for category badges. Add a search input that filters products by name (use signal for the search term and computed for filtered results).",
    solution: `import { Component, signal, computed } from '@angular/core';

interface Product {
  id: number;
  name: string;
  price: number;
  category: 'electronics' | 'clothing' | 'food';
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  template: \`
    <input type="text"
           placeholder="Search products..."
           [value]="searchTerm()"
           (input)="searchTerm.set($any($event.target).value)" />

    <p>Showing {{ filtered().length }} of {{ products().length }}</p>

    @for (product of filtered(); track product.id) {
      <div class="product">
        <h3>{{ product.name }}</h3>
        <p>\${{ product.price.toFixed(2) }}</p>
        @switch (product.category) {
          @case ('electronics') { <span class="badge">Electronics</span> }
          @case ('clothing') { <span class="badge">Clothing</span> }
          @default { <span class="badge">Food</span> }
        }
      </div>
    } @empty {
      <p>No products match your search.</p>
    }
  \`
})
export class ProductListComponent {
  products = signal<Product[]>([
    { id: 1, name: 'Laptop', price: 999, category: 'electronics' },
    { id: 2, name: 'T-Shirt', price: 25, category: 'clothing' },
    { id: 3, name: 'Coffee', price: 12, category: 'food' },
  ]);

  searchTerm = signal('');

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.products().filter(p =>
      p.name.toLowerCase().includes(term)
    );
  });
}`,
  },
  {
    time: "Hour 2",
    title: "TypeScript Essentials for Angular",
    concept: [
      "**TypeScript** is required in Angular â€” every file uses `.ts` extension. TypeScript adds static types on top of JavaScript: `let name: string = 'Alice';`. Key benefits: catch errors at compile time, better IDE support (autocompletion, refactoring), self-documenting code. Angular's decorators (`@Component`, `@Injectable`) rely on TypeScript's decorator and metadata capabilities.",
      "**Core types:** `string`, `number`, `boolean`, `any` (avoid!), `unknown` (safer any), `void`, `null`, `undefined`, `never`. Arrays: `string[]` or `Array<string>`. Tuples: `[string, number]`. Union types: `string | number`. Literal types: `type Status = 'active' | 'inactive'`. Template literal types: `type Route = \\`/api/\${string}\\``.",
      "**Interfaces vs Types:** Interfaces define object shapes: `interface User { name: string; age: number; email?: string; }`. The `?` makes a property optional. Types can do unions, intersections, mapped types: `type Result = Success | Error`. Prefer interfaces for object shapes (they can be extended), types for unions and utility types.",
      "**Generics** make code reusable with type safety: `function identity<T>(value: T): T { return value; }`. Angular uses generics everywhere: `Observable<User[]>`, `Signal<number>`, `FormControl<string>`. Generic constraints: `<T extends HasId>` ensures T has an `id` property. Utility types: `Partial<T>` (all optional), `Required<T>`, `Pick<T, K>`, `Omit<T, K>`, `Record<K, V>`.",
      "**Decorators** are TypeScript functions that add metadata to classes, methods, or properties. Angular's core decorators: `@Component` (UI component), `@Injectable` (service for DI), `@Input()` (receive data from parent), `@Output()` (emit events to parent), `@ViewChild` (access child component/element), `@HostListener` (DOM event listener). Decorators are processed by Angular's compiler at build time.",
      "**Enums and type narrowing:** Enums: `enum Role { Admin = 'ADMIN', User = 'USER' }`. Type guards narrow types: `if (typeof x === 'string') { x.toUpperCase(); }`. Discriminated unions: `type Shape = { kind: 'circle'; radius: number } | { kind: 'rect'; width: number; height: number }`. Use `satisfies` (TS 4.9+) for type-safe object literals: `const config = { api: '/api' } satisfies Config;`.",
    ],
    code: `// === TypeScript Essentials for Angular ===

// 1. Interfaces â€” define data shapes
interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  avatar?: string;              // optional property
  readonly createdAt: Date;     // cannot be reassigned
}

enum Role {
  Admin = 'ADMIN',
  Editor = 'EDITOR',
  Viewer = 'VIEWER',
}

// Extending interfaces
interface Employee extends User {
  department: string;
  salary: number;
}

// 2. Type aliases â€” unions, intersections, utilities
type ApiResponse<T> = {
  data: T;
  status: number;
  message: string;
  timestamp: string;
};

type UserResponse = ApiResponse<User>;
type UserListResponse = ApiResponse<User[]>;

// Discriminated union (great for state management)
type LoadingState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

// Usage with type narrowing
function handleState(state: LoadingState<User[]>) {
  switch (state.status) {
    case 'idle':    return 'Ready';
    case 'loading': return 'Loading...';
    case 'success': return \`Found \${state.data.length} users\`; // TS knows data exists
    case 'error':   return \`Error: \${state.error}\`;          // TS knows error exists
  }
}

// 3. Generics in Angular context
interface CrudService<T extends { id: number }> {
  getAll(): Observable<T[]>;
  getById(id: number): Observable<T>;
  create(item: Omit<T, 'id'>): Observable<T>;
  update(id: number, item: Partial<T>): Observable<T>;
  delete(id: number): Observable<void>;
}

// 4. Utility types
type CreateUserDto = Omit<User, 'id' | 'createdAt'>;
type UpdateUserDto = Partial<CreateUserDto>;
type UserSummary = Pick<User, 'id' | 'name' | 'email'>;
type RolePermissions = Record<Role, string[]>;

const permissions: RolePermissions = {
  [Role.Admin]:  ['read', 'write', 'delete', 'admin'],
  [Role.Editor]: ['read', 'write'],
  [Role.Viewer]: ['read'],
};

// 5. Decorators in Angular
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-user-card',
  standalone: true,
  template: \`
    <div class="card" (click)="selected.emit(user)">
      <h3>{{ user.name }}</h3>
      <p>{{ user.email }}</p>
      <span class="role">{{ user.role }}</span>
    </div>
  \`
})
export class UserCardComponent {
  @Input({ required: true }) user!: User;    // required input (Angular 16+)
  @Output() selected = new EventEmitter<User>();
}

// 6. Type-safe forms (preview)
interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}`,
    practice: "Define a complete type system for a blog application: Post interface (id, title, body, author: User, tags: string[], status: 'draft'|'published', createdAt, updatedAt), CreatePostDto, UpdatePostDto, and a generic PaginatedResponse<T> with items, total, page, pageSize. Create a type-safe PostService interface using these types.",
    solution: `import { Observable } from 'rxjs';

interface User {
  id: number;
  name: string;
  email: string;
}

interface Post {
  id: number;
  title: string;
  body: string;
  author: User;
  tags: string[];
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

type CreatePostDto = Omit<Post, 'id' | 'author' | 'createdAt' | 'updatedAt'> & {
  authorId: number;
};

type UpdatePostDto = Partial<Omit<CreatePostDto, 'authorId'>>;

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface PostService {
  getAll(page: number, size: number): Observable<PaginatedResponse<Post>>;
  getById(id: number): Observable<Post>;
  create(dto: CreatePostDto): Observable<Post>;
  update(id: number, dto: UpdatePostDto): Observable<Post>;
  delete(id: number): Observable<void>;
  getByTag(tag: string): Observable<Post[]>;
  search(query: string): Observable<Post[]>;
}`,
  },
  {
    time: "Hour 3",
    title: "Components Deep Dive â€” Input, Output, Signals & Lifecycle",
    concept: [
      "**@Input()** passes data from parent to child: `@Input() name: string = '';`. Angular 16+ added `required`: `@Input({ required: true }) user!: User;` â€” compile error if parent doesn't provide it. Angular 17+ introduced **signal inputs**: `name = input<string>('')` and `user = input.required<User>()` â€” fully reactive, no need for ngOnChanges.",
      "**@Output()** emits events from child to parent using EventEmitter: `@Output() saved = new EventEmitter<User>();`. In the template: `(saved)=\"onSaved($event)\"`. Angular 17+ introduced **output()** function: `saved = output<User>()` â€” cleaner API. Call `this.saved.emit(user)` to fire the event. Always type your EventEmitter/output for type safety.",
      "**Signals** (Angular 16+) are reactive primitives that replace many RxJS use cases for component state. `count = signal(0)` â€” creates a writable signal. Read: `count()`. Write: `count.set(5)`, `count.update(n => n + 1)`. **computed()** derives values: `double = computed(() => this.count() * 2)`. **effect()** runs side effects when signals change: `effect(() => console.log(this.count()))`.",
      "**Lifecycle hooks:** `ngOnInit()` â€” after first data-bound properties set (fetch data here). `ngOnChanges(changes)` â€” when @Input values change. `ngAfterViewInit()` â€” after view and child views initialized. `ngOnDestroy()` â€” cleanup (unsubscribe, clear timers). Implement interfaces: `implements OnInit, OnDestroy`. With signals, many lifecycle hooks become unnecessary â€” computed/effect replace ngOnChanges.",
      "**Content projection** (`ng-content`) lets parent inject content into child templates. Single slot: `<ng-content />`. Named slots: `<ng-content select=\"[header]\" />`, `<ng-content select=\"[body]\" />`. This is Angular's equivalent of React's children/slots. Use for reusable container components like cards, modals, and layouts.",
      "**ViewChild and template references:** `@ViewChild('myInput') inputRef!: ElementRef;` accesses a DOM element. `#myInput` in template creates a reference. **ViewChild with component type:** `@ViewChild(ChildComponent) child!: ChildComponent;` â€” access child component methods. Use `afterViewInit` to ensure ViewChild is available. Angular 17+ signals alternative: `viewChild.required<ElementRef>('myInput')`.",
    ],
    code: `// === Components Deep Dive ===

// 1. Modern Angular Component with Signal Inputs (Angular 17+)
import { Component, input, output, signal, computed, effect } from '@angular/core';

interface Product {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
}

@Component({
  selector: 'app-product-card',
  standalone: true,
  template: \`
    <div class="card" [class.out-of-stock]="!product().inStock">
      <h3>{{ product().name }}</h3>
      <p class="price">\${{ product().price.toFixed(2) }}</p>

      @if (product().inStock) {
        <div class="quantity">
          <button (click)="decrement()">-</button>
          <span>{{ quantity() }}</span>
          <button (click)="increment()">+</button>
        </div>
        <p class="subtotal">Subtotal: \${{ subtotal() }}</p>
        <button (click)="addToCart.emit({
          product: product(),
          quantity: quantity()
        })">
          Add to Cart
        </button>
      } @else {
        <p class="sold-out">Sold Out</p>
      }
    </div>
  \`
})
export class ProductCardComponent {
  // Signal inputs (Angular 17+) â€” reactive, no ngOnChanges needed
  product = input.required<Product>();

  // Output with new API
  addToCart = output<{ product: Product; quantity: number }>();

  // Internal state with signals
  quantity = signal(1);

  // Computed value â€” auto-updates when dependencies change
  subtotal = computed(() =>
    (this.product().price * this.quantity()).toFixed(2)
  );

  increment() { this.quantity.update(q => q + 1); }
  decrement() { this.quantity.update(q => Math.max(1, q - 1)); }
}

// 2. Parent Component using the ProductCard
@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [ProductCardComponent],
  template: \`
    <h1>Shop ({{ cartCount() }} items in cart)</h1>

    <div class="grid">
      @for (product of products(); track product.id) {
        <app-product-card
          [product]="product"
          (addToCart)="onAddToCart($event)" />
      }
    </div>

    @if (cart().length > 0) {
      <div class="cart-summary">
        <h2>Cart Total: \${{ cartTotal() }}</h2>
      </div>
    }
  \`
})
export class ShopComponent {
  products = signal<Product[]>([
    { id: 1, name: 'Laptop', price: 999.99, inStock: true },
    { id: 2, name: 'Mouse', price: 29.99, inStock: true },
    { id: 3, name: 'Keyboard', price: 79.99, inStock: false },
  ]);

  cart = signal<{ product: Product; quantity: number }[]>([]);

  cartCount = computed(() =>
    this.cart().reduce((sum, item) => sum + item.quantity, 0)
  );

  cartTotal = computed(() =>
    this.cart()
      .reduce((sum, item) => sum + item.product.price * item.quantity, 0)
      .toFixed(2)
  );

  onAddToCart(item: { product: Product; quantity: number }) {
    this.cart.update(cart => [...cart, item]);
  }
}

// 3. Content Projection â€” reusable card layout
@Component({
  selector: 'app-card',
  standalone: true,
  template: \`
    <div class="card">
      <div class="card-header">
        <ng-content select="[header]" />
      </div>
      <div class="card-body">
        <ng-content />
      </div>
      <div class="card-footer">
        <ng-content select="[footer]" />
      </div>
    </div>
  \`
})
export class CardComponent {}

// Usage:
// <app-card>
//   <h3 header>User Profile</h3>
//   <p>Name: {{ user.name }}</p>
//   <p>Email: {{ user.email }}</p>
//   <button footer (click)="edit()">Edit</button>
// </app-card>

// 4. Lifecycle Hooks
import { OnInit, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-timer',
  standalone: true,
  template: \`<p>Elapsed: {{ seconds() }}s</p>\`
})
export class TimerComponent implements OnInit, OnDestroy {
  seconds = signal(0);
  private sub?: Subscription;

  ngOnInit() {
    this.sub = interval(1000).subscribe(() =>
      this.seconds.update(s => s + 1)
    );
  }

  ngOnDestroy() {
    this.sub?.unsubscribe(); // cleanup to prevent memory leaks
  }
}`,
    practice: "Build a reusable ModalComponent with content projection (header, body, footer slots). It should have an isOpen signal input, a closed output event, and close when clicking the overlay or pressing Escape. Then create a ConfirmDialogComponent that uses ModalComponent and emits confirmed/cancelled events.",
    solution: `import { Component, input, output, signal, HostListener } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  template: \\\`
    @if (isOpen()) {
      <div class="overlay" (click)="close()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <ng-content select="[header]" />
            <button class="close-btn" (click)="close()">&times;</button>
          </div>
          <div class="modal-body"><ng-content /></div>
          <div class="modal-footer"><ng-content select="[footer]" /></div>
        </div>
      </div>
    }
  \\\`
})
export class ModalComponent {
  isOpen = input(false);
  closed = output<void>();

  @HostListener('document:keydown.escape')
  close() { this.closed.emit(); }
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [ModalComponent],
  template: \\\`
    <app-modal [isOpen]="open()" (closed)="cancelled.emit()">
      <h3 header>{{ title() }}</h3>
      <p>{{ message() }}</p>
      <div footer>
        <button (click)="cancelled.emit()">Cancel</button>
        <button class="danger" (click)="confirmed.emit()">Confirm</button>
      </div>
    </app-modal>
  \\\`
})
export class ConfirmDialogComponent {
  open = input(false);
  title = input('Confirm');
  message = input('Are you sure?');
  confirmed = output<void>();
  cancelled = output<void>();
}`,
  },
  {
    time: "Hour 4",
    title: "Services, Dependency Injection & HttpClient",
    concept: [
      "**Services** encapsulate business logic, data access, and shared state. Create with `ng generate service core/services/user`. Mark with `@Injectable({ providedIn: 'root' })` â€” Angular creates a singleton available app-wide. Services should NOT contain UI logic â€” they handle API calls, data transformation, and business rules. Angular's DI system wires everything together automatically.",
      "**Dependency Injection (DI)** is Angular's core pattern. Instead of `new UserService()`, Angular creates and injects instances: `constructor(private userService: UserService) {}`. DI provides: testability (mock services in tests), loose coupling, and singleton management. The `inject()` function (Angular 14+) is the modern alternative: `private userService = inject(UserService);`.",
      "**HttpClient** sends HTTP requests and returns Observables. Import `provideHttpClient()` in app config. Methods: `get<T>(url)`, `post<T>(url, body)`, `put<T>(url, body)`, `patch<T>(url, body)`, `delete<T>(url)`. Always type responses: `this.http.get<User[]>('/api/users')`. HttpClient auto-parses JSON, handles errors, and supports interceptors for auth tokens and logging.",
      "**Interceptors** (functional, Angular 15+) modify HTTP requests/responses globally. Auth interceptor adds tokens: `req = req.clone({ setHeaders: { Authorization: \\`Bearer \${token}\\` } })`. Logging interceptor tracks request timing. Error interceptor handles 401/403 globally. Register with `provideHttpClient(withInterceptors([authInterceptor, loggingInterceptor]))`.",
      "**Error handling:** Use RxJS `catchError` operator: `.pipe(catchError(err => { ... }))`. Return `throwError(() => new Error(...))` to propagate, or return a fallback value with `of(defaultData)`. The `retry(3)` operator retries failed requests. Build a centralized error handling service that interceptors delegate to.",
      "**Environment configuration:** `environment.ts` stores API URLs: `export const environment = { apiUrl: 'http://localhost:8080/api' }`. Production values in `environment.prod.ts`. Access with: `inject(ENVIRONMENT)` or direct import. Angular CLI automatically swaps environments during `ng build --configuration=production`.",
    ],
    code: `// === Services & HttpClient ===

// 1. App Configuration (app.config.ts)
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};

// 2. Service with HttpClient
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError, retry } from 'rxjs';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = '/api/users';

  getAll(page = 0, size = 10): Observable<PaginatedResponse<User>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);
    return this.http.get<PaginatedResponse<User>>(this.apiUrl, { params });
  }

  getById(id: number): Observable<User> {
    return this.http.get<User>(\`\${this.apiUrl}/\${id}\`).pipe(
      retry(2), // retry twice on failure
      catchError(this.handleError)
    );
  }

  create(user: Omit<User, 'id'>): Observable<User> {
    return this.http.post<User>(this.apiUrl, user).pipe(
      catchError(this.handleError)
    );
  }

  update(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(\`\${this.apiUrl}/\${id}\`, user).pipe(
      catchError(this.handleError)
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(\`\${this.apiUrl}/\${id}\`).pipe(
      catchError(this.handleError)
    );
  }

  search(query: string): Observable<User[]> {
    return this.http.get<User[]>(\`\${this.apiUrl}/search\`, {
      params: { q: query }
    });
  }

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    const message = error.error?.message || 'An error occurred';
    return throwError(() => new Error(message));
  }
}

// 3. Functional Auth Interceptor (Angular 15+)
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: \`Bearer \${token}\` }
    });
  }
  return next(req);
};

// 4. Logging Interceptor
import { tap } from 'rxjs';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const started = Date.now();
  return next(req).pipe(
    tap({
      next: () => {
        const elapsed = Date.now() - started;
        console.log(\`\${req.method} \${req.url} - \${elapsed}ms\`);
      },
      error: (err) => {
        console.error(\`\${req.method} \${req.url} FAILED\`, err);
      }
    })
  );
};

// 5. Component using the Service
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule],
  template: \`
    @if (loading()) {
      <div class="spinner">Loading...</div>
    }

    @if (error()) {
      <div class="error">{{ error() }}</div>
    }

    @for (user of users(); track user.id) {
      <div class="user-card">
        <h3>{{ user.name }}</h3>
        <p>{{ user.email }}</p>
      </div>
    }
  \`
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);

  users = signal<User[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    this.error.set(null);
    this.userService.getAll().subscribe({
      next: (response) => {
        this.users.set(response.content);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }
}`,
    practice: "Build a TaskService with CRUD operations and a functional error interceptor that shows a toast notification on 4xx/5xx errors. The service should cache the task list and invalidate on create/update/delete. Use the service in a TaskDashboardComponent that shows loading, error, and data states.",
    solution: `import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpInterceptorFn } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';

interface Task {
  id: number;
  title: string;
  completed: boolean;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private url = '/api/tasks';
  private cache = signal<Task[] | null>(null);

  getAll(): Observable<Task[]> {
    if (this.cache()) return new Observable(sub => {
      sub.next(this.cache()!);
      sub.complete();
    });
    return this.http.get<Task[]>(this.url).pipe(
      tap(tasks => this.cache.set(tasks))
    );
  }

  create(task: Omit<Task, 'id'>): Observable<Task> {
    return this.http.post<Task>(this.url, task).pipe(
      tap(() => this.cache.set(null)) // invalidate
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(\\\`\${this.url}/\${id}\\\`).pipe(
      tap(() => this.cache.set(null))
    );
  }
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError(err => {
      if (err.status >= 400) {
        console.error(\\\`HTTP \${err.status}: \${err.error?.message || 'Unknown'}\\\`);
        // In production: inject(ToastService).show(...)
      }
      return throwError(() => err);
    })
  );
};`,
  },
  {
    time: "Hour 5",
    title: "Routing, Navigation & Route Guards",
    concept: [
      "**Angular Router** maps URLs to components. Define routes in `app.routes.ts`: `{ path: 'users', component: UserListComponent }`. The `<router-outlet />` renders the matched component. Use `routerLink` for navigation: `<a routerLink=\"/users\">Users</a>`. Programmatic navigation: `inject(Router).navigate(['/users', userId])`.",
      "**Route parameters:** Static: `/users/:id`. Access in component: `const id = inject(ActivatedRoute).snapshot.params['id']`. Or reactive: `inject(ActivatedRoute).params.subscribe(p => ...)`. **Query params:** `/users?page=1&sort=name`. Access: `route.queryParams`. **Route data:** `{ path: 'admin', data: { roles: ['ADMIN'] } }` â€” pass static metadata.",
      "**Lazy loading** loads feature modules on demand, reducing initial bundle size. Use `loadComponent`: `{ path: 'admin', loadComponent: () => import('./admin/admin.component').then(m => m.AdminComponent) }`. For multiple routes: `loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES)`. Angular CLI automatically creates code-split chunks.",
      "**Route Guards** protect routes. Functional guards (Angular 15+): `canActivate: [() => inject(AuthService).isLoggedIn()]`. Types: `CanActivate` (can enter?), `CanDeactivate` (can leave? unsaved changes?), `CanMatch` (should route match at all?), `Resolve` (pre-fetch data before rendering). Guards return `boolean`, `UrlTree` (redirect), or `Observable<boolean>`.",
      "**Nested routes** define child components within a parent layout: `{ path: 'dashboard', component: DashboardLayout, children: [{ path: 'stats', component: StatsComponent }, { path: 'settings', component: SettingsComponent }] }`. The parent template needs its own `<router-outlet />`. This creates URL structures like `/dashboard/stats`.",
      "**Router events and resolvers:** Listen to navigation events: `inject(Router).events.subscribe(e => { if (e instanceof NavigationEnd) { ... } })`. **Resolvers** pre-fetch data before a route activates: `resolve: { users: () => inject(UserService).getAll() }`. Access resolved data: `inject(ActivatedRoute).data`. Resolvers prevent empty-state flicker.",
    ],
    code: `// === Routing & Navigation ===

// 1. Route Configuration (app.routes.ts)
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

  // Eager-loaded route
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then(m => m.LoginComponent),
  },

  // Protected routes with guard
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component')
        .then(m => m.DashboardComponent),
  },

  // Route with parameters
  {
    path: 'users/:id',
    canActivate: [authGuard],
    resolve: {
      user: (route: any) => {
        const userService = inject(UserService);
        return userService.getById(+route.params['id']);
      }
    },
    loadComponent: () =>
      import('./features/users/user-detail.component')
        .then(m => m.UserDetailComponent),
  },

  // Nested routes (children)
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('ADMIN')],
    loadComponent: () =>
      import('./features/admin/admin-layout.component')
        .then(m => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./features/admin/overview.component')
            .then(m => m.OverviewComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/admin/settings.component')
            .then(m => m.SettingsComponent),
      },
    ],
  },

  // Wildcard â€” 404 page
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component')
        .then(m => m.NotFoundComponent),
  },
];

// 2. Functional Auth Guard
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }
  // Redirect to login with return URL
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};

// Role-based guard factory
export const roleGuard = (requiredRole: string): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    return auth.hasRole(requiredRole);
  };
};

// 3. Component with Route Params and Navigation
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [RouterLink],
  template: \`
    @if (user()) {
      <div class="user-detail">
        <a routerLink="/users">&larr; Back to Users</a>
        <h2>{{ user()!.name }}</h2>
        <p>Email: {{ user()!.email }}</p>
        <p>Role: {{ user()!.role }}</p>
        <button (click)="editUser()">Edit</button>
        <button (click)="deleteUser()" class="danger">Delete</button>
      </div>
    }
  \`
})
export class UserDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);

  user = signal<User | null>(null);

  ngOnInit() {
    // Option 1: From resolver (pre-fetched)
    this.user.set(this.route.snapshot.data['user']);

    // Option 2: From route params (reactive)
    // this.route.params.subscribe(params => {
    //   this.userService.getById(+params['id']).subscribe(
    //     user => this.user.set(user)
    //   );
    // });
  }

  editUser() {
    this.router.navigate(['/users', this.user()!.id, 'edit']);
  }

  deleteUser() {
    this.userService.delete(this.user()!.id).subscribe(() =>
      this.router.navigate(['/users'])
    );
  }
}`,
    practice: "Create a complete routing setup for an e-commerce app: /products (list), /products/:id (detail), /cart (guarded â€” must be logged in), /checkout (guarded + has items in cart), /admin/* (role guard). Add a breadcrumb component that reads route data to display the current path.",
    solution: `import { Routes, CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() || router.createUrlTree(['/login']);
};

const cartNotEmptyGuard: CanActivateFn = () => {
  const cart = inject(CartService);
  const router = inject(Router);
  return cart.itemCount() > 0 || router.createUrlTree(['/cart']);
};

const roleGuard = (role: string): CanActivateFn => () => {
  const auth = inject(AuthService);
  return auth.hasRole(role);
};

export const routes: Routes = [
  { path: '', redirectTo: '/products', pathMatch: 'full' },
  {
    path: 'products',
    data: { breadcrumb: 'Products' },
    loadComponent: () => import('./products/list.component').then(m => m.ProductListComponent),
  },
  {
    path: 'products/:id',
    data: { breadcrumb: 'Product Detail' },
    resolve: { product: (r: any) => inject(ProductService).getById(+r.params['id']) },
    loadComponent: () => import('./products/detail.component').then(m => m.ProductDetailComponent),
  },
  {
    path: 'cart',
    canActivate: [authGuard],
    data: { breadcrumb: 'Cart' },
    loadComponent: () => import('./cart/cart.component').then(m => m.CartComponent),
  },
  {
    path: 'checkout',
    canActivate: [authGuard, cartNotEmptyGuard],
    data: { breadcrumb: 'Checkout' },
    loadComponent: () => import('./checkout/checkout.component').then(m => m.CheckoutComponent),
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('ADMIN')],
    data: { breadcrumb: 'Admin' },
    loadComponent: () => import('./admin/layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: 'products', data: { breadcrumb: 'Manage Products' },
        loadComponent: () => import('./admin/products.component').then(m => m.default) },
      { path: 'orders', data: { breadcrumb: 'Orders' },
        loadComponent: () => import('./admin/orders.component').then(m => m.default) },
    ],
  },
  { path: '**', loadComponent: () => import('./not-found.component').then(m => m.default) },
];`,
  },
  {
    time: "Hour 6",
    title: "Reactive Forms & Template-Driven Forms",
    concept: [
      "**Angular has two form approaches:** (1) **Template-driven forms** â€” simple, driven by directives in the template (`ngModel`). Good for login forms, search bars. (2) **Reactive forms** â€” programmatic, driven by TypeScript code. Better for complex forms with dynamic fields, validation, and testing. Production apps almost always use reactive forms.",
      "**Reactive Forms** use `FormControl`, `FormGroup`, and `FormArray` from `@angular/forms`. `FormControl<string>` manages a single input. `FormGroup` groups controls: `new FormGroup({ name: new FormControl(''), email: new FormControl('') })`. `FormArray` manages dynamic lists of controls. Import `ReactiveFormsModule` in standalone components.",
      "**FormBuilder** simplifies creation: `fb.group({ name: ['', Validators.required], email: ['', [Validators.required, Validators.email]], password: ['', [Validators.required, Validators.minLength(8)]] })`. The array syntax is `[defaultValue, validators, asyncValidators]`. Use `fb.nonNullable.group({...})` for strict non-null typing (Angular 14+).",
      "**Built-in validators:** `Validators.required`, `.minLength(n)`, `.maxLength(n)`, `.pattern(regex)`, `.email`, `.min(n)`, `.max(n)`. Combine: `[Validators.required, Validators.minLength(3)]`. **Custom validators** are functions: `function noWhitespace(c: AbstractControl) { return c.value.trim() ? null : { whitespace: true }; }`. Return `null` for valid, `{errorKey: true}` for invalid.",
      "**Async validators** call APIs: `function uniqueEmail(http: HttpClient) { return (c: AbstractControl) => http.get('/api/check?email=' + c.value).pipe(map(exists => exists ? {taken: true} : null)); }`. They run after sync validators pass. Use `updateOn: 'blur'` to avoid API calls on every keystroke.",
      "**Form state and display:** `form.valid`, `form.invalid`, `form.dirty`, `form.touched`, `form.pending` (async validators running). Show errors conditionally: `@if (form.get('email')?.hasError('email') && form.get('email')?.touched) { <span>Invalid email</span> }`. Disable submit: `[disabled]=\"form.invalid || form.pending\"`. Reset: `form.reset()`, `form.patchValue({name: 'New'})`, `form.setValue({...all fields...})`.",
    ],
    code: `// === Reactive Forms ===

import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators,
         AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';

// 1. Custom Validators
function passwordMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password === confirm ? null : { passwordMismatch: true };
}

function noWhitespace(control: AbstractControl): ValidationErrors | null {
  if (control.value && control.value.trim().length === 0) {
    return { whitespace: true };
  }
  return null;
}

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: \`
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <!-- Name field -->
      <div class="field">
        <label for="name">Full Name</label>
        <input id="name" formControlName="name" />
        @if (form.get('name')?.hasError('required') &&
             form.get('name')?.touched) {
          <span class="error">Name is required</span>
        }
        @if (form.get('name')?.hasError('minlength')) {
          <span class="error">
            Min {{ form.get('name')?.getError('minlength').requiredLength }} chars
          </span>
        }
      </div>

      <!-- Email field -->
      <div class="field">
        <label for="email">Email</label>
        <input id="email" type="email" formControlName="email" />
        @if (form.get('email')?.hasError('email') &&
             form.get('email')?.touched) {
          <span class="error">Invalid email format</span>
        }
      </div>

      <!-- Password group (cross-field validation) -->
      <div formGroupName="passwords">
        <div class="field">
          <label>Password</label>
          <input type="password" formControlName="password" />
          @if (form.get('passwords.password')?.hasError('minlength')) {
            <span class="error">Min 8 characters</span>
          }
        </div>
        <div class="field">
          <label>Confirm Password</label>
          <input type="password" formControlName="confirmPassword" />
          @if (form.get('passwords')?.hasError('passwordMismatch') &&
               form.get('passwords.confirmPassword')?.touched) {
            <span class="error">Passwords do not match</span>
          }
        </div>
      </div>

      <!-- Dynamic phone numbers (FormArray) -->
      <div>
        <label>Phone Numbers</label>
        @for (phone of phoneNumbers.controls; track $index) {
          <div class="phone-row">
            <input [formControl]="phone" />
            <button type="button" (click)="removePhone($index)">Remove</button>
          </div>
        }
        <button type="button" (click)="addPhone()">+ Add Phone</button>
      </div>

      <!-- Role selection -->
      <div class="field">
        <label>Role</label>
        <select formControlName="role">
          <option value="">Select...</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="editor">Editor</option>
        </select>
      </div>

      <button type="submit" [disabled]="form.invalid || form.pending">
        Register
      </button>

      <!-- Debug: show form value -->
      <pre>{{ form.value | json }}</pre>
      <pre>Valid: {{ form.valid }} | Dirty: {{ form.dirty }}</pre>
    </form>
  \`
})
export class RegistrationComponent {
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), noWhitespace]],
    email: ['', [Validators.required, Validators.email]],
    passwords: this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    }, { validators: passwordMatch }),
    phones: this.fb.array([this.fb.control('', Validators.pattern(/^\\+?[0-9]{10,15}$/))]),
    role: ['user', Validators.required],
  });

  get phoneNumbers() {
    return this.form.controls.phones;
  }

  addPhone() {
    this.phoneNumbers.push(
      this.fb.control('', Validators.pattern(/^\\+?[0-9]{10,15}$/))
    );
  }

  removePhone(index: number) {
    this.phoneNumbers.removeAt(index);
  }

  onSubmit() {
    if (this.form.valid) {
      console.log('Form value:', this.form.getRawValue());
      // API call
      this.form.reset();
    }
  }
}`,
    practice: "Build an OrderFormComponent with: customer info (name, email, phone), dynamically-addable order items (product name, quantity, unit price â€” each a FormGroup in a FormArray), a computed total, and validation (all required, quantity > 0, price > 0). Show inline errors and a summary section.",
    solution: `import { Component, inject, computed, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: \\\`
    <form [formGroup]="form" (ngSubmit)="submit()">
      <h3>Customer</h3>
      <input formControlName="name" placeholder="Name" />
      <input formControlName="email" placeholder="Email" type="email" />

      <h3>Items</h3>
      <div formArrayName="items">
        @for (item of items.controls; track $index; let i = $index) {
          <div [formGroupName]="i" class="item-row">
            <input formControlName="product" placeholder="Product" />
            <input formControlName="qty" type="number" placeholder="Qty" />
            <input formControlName="price" type="number" placeholder="Price" />
            <button type="button" (click)="removeItem(i)">X</button>
          </div>
        }
      </div>
      <button type="button" (click)="addItem()">+ Add Item</button>

      <p><strong>Total: \${{ total() }}</strong></p>
      <button [disabled]="form.invalid">Submit Order</button>
    </form>
  \\\`
})
export class OrderFormComponent {
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    items: this.fb.array([this.createItem()]),
  });

  get items() { return this.form.controls.items; }

  total = computed(() => {
    return this.items.controls.reduce((sum, g) => {
      const qty = g.get('qty')?.value || 0;
      const price = g.get('price')?.value || 0;
      return sum + qty * price;
    }, 0).toFixed(2);
  });

  createItem() {
    return this.fb.group({
      product: ['', Validators.required],
      qty: [1, [Validators.required, Validators.min(1)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
    });
  }

  addItem() { this.items.push(this.createItem()); }
  removeItem(i: number) { this.items.removeAt(i); }
  submit() { console.log(this.form.getRawValue()); }
}`,
  },
  {
    time: "Hour 7",
    title: "RxJS & Observables â€” The Reactive Foundation",
    concept: [
      "**RxJS** (Reactive Extensions for JavaScript) is Angular's core async library. An **Observable** is a stream of values over time â€” like a Promise that can emit multiple values. Angular uses Observables everywhere: HttpClient responses, route params, form value changes, event streams. Key concept: Observables are LAZY â€” they do nothing until you subscribe.",
      "**Creating Observables:** `of(1, 2, 3)` â€” emits values synchronously. `from([1,2,3])` â€” from array/Promise/iterable. `interval(1000)` â€” emits every N ms. `timer(2000)` â€” emits once after delay. `fromEvent(el, 'click')` â€” from DOM events. `new Observable(subscriber => { subscriber.next(value); subscriber.complete(); })` â€” custom.",
      "**Key operators â€” Transformation:** `map(x => x * 2)` â€” transform each value. `switchMap(id => http.get(url + id))` â€” cancel previous, use latest (HTTP requests). `mergeMap(id => http.get(url + id))` â€” run in parallel. `concatMap(id => http.get(url + id))` â€” run in sequence. `exhaustMap` â€” ignore new until current completes (submit buttons).",
      "**Key operators â€” Filtering:** `filter(x => x > 5)` â€” keep matching values. `distinctUntilChanged()` â€” skip duplicates. `debounceTime(300)` â€” wait 300ms after last emit (search input). `throttleTime(1000)` â€” emit at most once per second. `take(5)` â€” take first 5, then complete. `takeUntil(destroy$)` â€” auto-unsubscribe on destroy.",
      "**Key operators â€” Combination:** `combineLatest([obs1, obs2])` â€” emit when ANY source emits (latest from each). `forkJoin([obs1, obs2])` â€” emit once when ALL complete (parallel HTTP). `merge(obs1, obs2)` â€” merge multiple into one stream. `withLatestFrom(other$)` â€” combine with latest value from another Observable.",
      "**Subjects:** `Subject` â€” multicast Observable, both producer and consumer. `BehaviorSubject(initialValue)` â€” stores current value, new subscribers get last value. `ReplaySubject(bufferSize)` â€” replays N values. `AsyncSubject` â€” emits only last value on complete. BehaviorSubject is ideal for state management: `private users$ = new BehaviorSubject<User[]>([]);`.",
    ],
    code: `// === RxJS & Observables ===

import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  Subject, BehaviorSubject, Observable, combineLatest, forkJoin,
  of, timer, interval, merge, EMPTY
} from 'rxjs';
import {
  map, filter, switchMap, debounceTime, distinctUntilChanged,
  catchError, takeUntil, tap, retry, startWith, shareReplay,
  exhaustMap, scan
} from 'rxjs/operators';

// 1. Search with debounce + switchMap (cancel previous)
@Component({
  selector: 'app-search',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: \`
    <input [formControl]="searchControl" placeholder="Search users..." />
    @for (user of results(); track user.id) {
      <div>{{ user.name }} â€” {{ user.email }}</div>
    }
  \`
})
export class SearchComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private destroy$ = new Subject<void>();

  searchControl = new FormControl('');
  results = signal<any[]>([]);

  ngOnInit() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),               // wait 300ms after typing stops
      distinctUntilChanged(),           // skip if same value
      filter(q => !!q && q.length > 2), // min 3 chars
      switchMap(query =>               // cancel previous request
        this.http.get<any[]>(\`/api/users/search?q=\${query}\`).pipe(
          catchError(() => of([]))     // return empty on error
        )
      ),
      takeUntil(this.destroy$)         // auto-unsubscribe
    ).subscribe(users => this.results.set(users));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

// 2. Combining multiple streams
@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: \`<p>{{ summary() }}</p>\`
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  summary = signal('Loading...');

  ngOnInit() {
    // forkJoin â€” parallel requests, wait for ALL
    forkJoin({
      users: this.http.get<any[]>('/api/users'),
      orders: this.http.get<any[]>('/api/orders'),
      revenue: this.http.get<{ total: number }>('/api/revenue'),
    }).subscribe(({ users, orders, revenue }) => {
      this.summary.set(
        \`\${users.length} users, \${orders.length} orders, $\${revenue.total}\`
      );
    });

    // combineLatest â€” react to ANY change
    const filter$ = this.filterControl.valueChanges.pipe(startWith('all'));
    const sort$ = this.sortControl.valueChanges.pipe(startWith('name'));
    const page$ = this.page$.pipe(startWith(0));

    combineLatest([filter$, sort$, page$]).pipe(
      switchMap(([filter, sort, page]) =>
        this.http.get(\`/api/items?filter=\${filter}&sort=\${sort}&page=\${page}\`)
      )
    ).subscribe(items => this.items.set(items));
  }
}

// 3. BehaviorSubject for state management
@Injectable({ providedIn: 'root' })
export class CartStore {
  private _items$ = new BehaviorSubject<CartItem[]>([]);

  // Public read-only observable
  items$ = this._items$.asObservable();

  // Derived state
  itemCount$ = this._items$.pipe(
    map(items => items.reduce((sum, i) => sum + i.quantity, 0))
  );

  total$ = this._items$.pipe(
    map(items => items.reduce((sum, i) => sum + i.price * i.quantity, 0))
  );

  addItem(item: CartItem) {
    const current = this._items$.getValue();
    const existing = current.find(i => i.id === item.id);
    if (existing) {
      this._items$.next(current.map(i =>
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      this._items$.next([...current, { ...item, quantity: 1 }]);
    }
  }

  removeItem(id: number) {
    this._items$.next(
      this._items$.getValue().filter(i => i.id !== id)
    );
  }

  clear() { this._items$.next([]); }
}

// 4. exhaustMap for form submission (prevent double-submit)
@Component({
  selector: 'app-submit-form',
  standalone: true,
  template: \`<button (click)="submit$.next()">Save</button>\`
})
export class SubmitFormComponent implements OnInit {
  submit$ = new Subject<void>();
  private http = inject(HttpClient);

  ngOnInit() {
    this.submit$.pipe(
      exhaustMap(() =>                 // ignore clicks while saving
        this.http.post('/api/save', this.formData).pipe(
          catchError(err => { alert('Save failed'); return EMPTY; })
        )
      )
    ).subscribe(() => alert('Saved!'));
  }
}

// 5. shareReplay for caching
@Injectable({ providedIn: 'root' })
export class ConfigService {
  private http = inject(HttpClient);

  // Cached â€” only one HTTP call, shared with all subscribers
  config$ = this.http.get<AppConfig>('/api/config').pipe(
    shareReplay(1) // replay last value to new subscribers
  );
}`,
    practice: "Build a real-time NotificationService using BehaviorSubject. It should: store notifications, expose an observable stream, support add/dismiss/clear, auto-dismiss after 5 seconds using timer, and limit to max 5 visible. Create a NotificationListComponent that displays them with animation.",
    solution: `import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, timer } from 'rxjs';
import { map, tap } from 'rxjs/operators';

interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _items$ = new BehaviorSubject<Notification[]>([]);
  private nextId = 0;

  items$ = this._items$.pipe(
    map(items => items.slice(-5)) // max 5 visible
  );

  count$ = this._items$.pipe(map(items => items.length));

  add(message: string, type: Notification['type'] = 'info') {
    const notification: Notification = {
      id: this.nextId++,
      message,
      type,
      timestamp: new Date(),
    };
    this._items$.next([...this._items$.getValue(), notification]);

    // Auto-dismiss after 5 seconds
    timer(5000).subscribe(() => this.dismiss(notification.id));
  }

  dismiss(id: number) {
    this._items$.next(
      this._items$.getValue().filter(n => n.id !== id)
    );
  }

  clear() { this._items$.next([]); }
}`,
  },
  {
    time: "Hour 8",
    title: "Pipes, Directives & Change Detection",
    concept: [
      "**Pipes** transform data in templates: `{{ price | currency:'USD' }}`, `{{ date | date:'short' }}`, `{{ name | uppercase }}`, `{{ items | json }}`, `{{ value | number:'1.2-2' }}`. Chain pipes: `{{ date | date:'medium' | uppercase }}`. Built-in: `DatePipe`, `CurrencyPipe`, `DecimalPipe`, `PercentPipe`, `SlicePipe`, `AsyncPipe`, `KeyValuePipe`, `TitleCasePipe`.",
      "**AsyncPipe** subscribes to Observables/Promises in templates and auto-unsubscribes: `{{ users$ | async }}`. Eliminates manual subscribe/unsubscribe. Use with @if: `@if (data$ | async; as data) { <p>{{ data.name }}</p> }`. The AsyncPipe triggers change detection on new values. It's the cleanest way to consume Observables in templates.",
      "**Custom pipes:** `@Pipe({ name: 'truncate', standalone: true }) export class TruncatePipe implements PipeTransform { transform(value: string, length = 50): string { return value.length > length ? value.slice(0, length) + '...' : value; } }`. Use: `{{ longText | truncate:30 }}`. Mark as `pure: false` only if the pipe depends on external state (rare, has performance cost).",
      "**Directives** add behavior to DOM elements. **Attribute directives** change appearance/behavior: `[appHighlight]=\"'yellow'\"`. **Structural directives** change DOM structure (now replaced by @if/@for in Angular 17+). Create custom: `@Directive({ selector: '[appTooltip]', standalone: true })`. Use `HostListener` for events, `Renderer2` for safe DOM manipulation.",
      "**Change Detection** is how Angular updates the DOM when data changes. Default strategy: check entire component tree on every event. **OnPush strategy** only checks when: (1) @Input reference changes, (2) Event handler fires, (3) Async pipe emits, (4) Signal updates. Use OnPush for performance: `changeDetection: ChangeDetectionStrategy.OnPush`. Signals + OnPush = maximum performance.",
      "**Zone.js and NgZone:** Angular uses Zone.js to automatically detect changes after async operations (setTimeout, HTTP, events). `NgZone.runOutsideAngular(() => { ... })` â€” opt out of change detection for performance-sensitive code (animations, WebSocket). Signals (Angular 16+) are Zone-independent â€” they work without Zone.js, enabling future zoneless Angular.",
    ],
    code: `// === Pipes, Directives & Change Detection ===

// 1. Custom Pipes
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'truncate', standalone: true })
export class TruncatePipe implements PipeTransform {
  transform(value: string, length = 50, suffix = '...'): string {
    if (!value) return '';
    return value.length > length
      ? value.slice(0, length).trimEnd() + suffix
      : value;
  }
}

@Pipe({ name: 'timeAgo', standalone: true })
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date): string {
    const date = new Date(value);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    const intervals: [number, string][] = [
      [31536000, 'year'], [2592000, 'month'], [86400, 'day'],
      [3600, 'hour'], [60, 'minute'], [1, 'second'],
    ];

    for (const [secs, label] of intervals) {
      const count = Math.floor(seconds / secs);
      if (count >= 1) return \`\${count} \${label}\${count > 1 ? 's' : ''} ago\`;
    }
    return 'just now';
  }
}

@Pipe({ name: 'fileSize', standalone: true })
export class FileSizePipe implements PipeTransform {
  transform(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
  }
}

// Usage in template:
// {{ longText | truncate:100 }}
// {{ post.createdAt | timeAgo }}
// {{ attachment.size | fileSize }}

// 2. Custom Attribute Directive
import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  standalone: true,
})
export class HighlightDirective {
  color = input('yellow', { alias: 'appHighlight' });
  private el = inject(ElementRef);

  @HostListener('mouseenter') onMouseEnter() {
    this.el.nativeElement.style.backgroundColor = this.color();
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.el.nativeElement.style.backgroundColor = '';
  }
}

// Usage: <p [appHighlight]="'cyan'">Hover me!</p>

@Directive({
  selector: '[appCopyToClipboard]',
  standalone: true,
})
export class CopyToClipboardDirective {
  text = input.required<string>({ alias: 'appCopyToClipboard' });

  @HostListener('click') async onClick() {
    await navigator.clipboard.writeText(this.text());
    // Optionally show toast notification
  }
}

// 3. AsyncPipe â€” subscribe and auto-unsubscribe
@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, TimeAgoPipe],
  template: \`
    @if (user$ | async; as user) {
      <h2>{{ user.name }}</h2>
      <p>Email: {{ user.email }}</p>
      <p>Joined: {{ user.createdAt | timeAgo }}</p>
    } @else {
      <p>Loading profile...</p>
    }
  \`
})
export class UserProfileComponent {
  private userService = inject(UserService);
  user$ = this.userService.getCurrentUser();
}

// 4. OnPush Change Detection â€” optimal performance
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-product-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush, // only check on input/event/async
  template: \`
    @for (product of products(); track product.id) {
      <app-product-card [product]="product" />
    }
  \`
})
export class ProductListComponent {
  products = input.required<Product[]>();
  // With OnPush + signal inputs: maximum rendering performance
}

// 5. NgZone â€” opt out of change detection
import { NgZone } from '@angular/core';

@Component({
  selector: 'app-fps-counter',
  standalone: true,
  template: \`<div #counter></div>\`
})
export class FpsCounterComponent implements AfterViewInit {
  private zone = inject(NgZone);
  @ViewChild('counter') counterEl!: ElementRef;

  ngAfterViewInit() {
    // Run outside Angular â€” no change detection triggered
    this.zone.runOutsideAngular(() => {
      let frames = 0;
      const count = () => {
        frames++;
        requestAnimationFrame(count);
      };
      requestAnimationFrame(count);

      setInterval(() => {
        this.counterEl.nativeElement.textContent = \`FPS: \${frames}\`;
        frames = 0;
      }, 1000);
    });
  }
}`,
    practice: "Create a SearchHighlightPipe that wraps matched text in <mark> tags. Create a ClickOutsideDirective that emits when clicking outside the host element (useful for dropdown menus). Build a dropdown component that uses both.",
    solution: `import { Pipe, PipeTransform } from '@angular/core';
import { Directive, ElementRef, output, HostListener, inject } from '@angular/core';

@Pipe({ name: 'highlight', standalone: true })
export class HighlightPipe implements PipeTransform {
  transform(text: string, search: string): string {
    if (!search || !text) return text;
    const regex = new RegExp(\\\`(\${search})\\\`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
}

@Directive({ selector: '[appClickOutside]', standalone: true })
export class ClickOutsideDirective {
  private el = inject(ElementRef);
  clickOutside = output<void>({ alias: 'appClickOutside' });

  @HostListener('document:click', ['$event.target'])
  onClick(target: HTMLElement) {
    if (!this.el.nativeElement.contains(target)) {
      this.clickOutside.emit();
    }
  }
}`,
  },
  {
    time: "Hour 9",
    title: "Signals Deep Dive & State Management Patterns",
    concept: [
      "**Signals** are Angular's answer to reactive state management without RxJS complexity. A signal is a wrapper around a value that notifies consumers when it changes. Three types: `signal(value)` â€” writable. `computed(() => expr)` â€” derived, read-only, lazy, cached. `effect(() => sideEffect)` â€” runs when dependencies change. Signals integrate with Angular's change detection for optimal rendering.",
      "**Signal-based state management** replaces BehaviorSubject patterns. Store pattern: create a service with private signals, expose computed read-only views, provide mutation methods. `private _users = signal<User[]>([]); readonly users = this._users.asReadonly(); addUser(u: User) { this._users.update(list => [...list, u]); }`. This is simpler than NgRx for most apps.",
      "**toSignal() and toObservable()** bridge Signals and RxJS. `toSignal(observable$)` converts an Observable to a Signal â€” perfect for HttpClient: `users = toSignal(this.http.get<User[]>(url), { initialValue: [] })`. `toObservable(signal)` converts Signal to Observable â€” for when you need RxJS operators. Import from `@angular/core/rxjs-interop`.",
      "**NgRx** is Angular's Redux-inspired state management for large apps: Store (single source of truth), Actions (events), Reducers (pure functions that produce new state), Selectors (queries), Effects (side effects). Modern NgRx uses `createFeature()` and `signalStore()`. Use NgRx when: multiple components share complex state, you need undo/redo, time-travel debugging, or strict unidirectional data flow.",
      "**signalStore()** (NgRx Signals, modern approach) provides a lightweight, signal-based store: `const UserStore = signalStore(withState({users: [], loading: false}), withComputed(...), withMethods(...))`. Inject directly: `store = inject(UserStore)`. It combines the simplicity of services with the structure of Redux. Best of both worlds for medium-to-large apps.",
      "**Component Store** (NgRx) is a lightweight alternative for component-scoped state. It's a reactive store localized to a component/feature. Use it when state is too complex for signals alone but doesn't need app-wide sharing. It provides `setState()`, `select()`, and `effect()` methods. Most production Angular apps use a mix: signals for local state, signalStore for shared state.",
    ],
    code: `// === Signals Deep Dive & State Management ===

import { Component, inject, signal, computed, effect } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { switchMap, debounceTime } from 'rxjs/operators';

// 1. Signal-based Store Service (recommended for most apps)
interface AppState {
  users: User[];
  selectedUser: User | null;
  loading: boolean;
  error: string | null;
  filter: string;
}

@Injectable({ providedIn: 'root' })
export class UserStore {
  private http = inject(HttpClient);

  // Private writable state
  private _users = signal<User[]>([]);
  private _selected = signal<User | null>(null);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private _filter = signal('');

  // Public read-only signals
  readonly users = this._users.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filter = this._filter.asReadonly();

  // Derived state (auto-updates)
  readonly filteredUsers = computed(() => {
    const term = this._filter().toLowerCase();
    const all = this._users();
    return term
      ? all.filter(u => u.name.toLowerCase().includes(term))
      : all;
  });

  readonly userCount = computed(() => this.filteredUsers().length);

  readonly activeCount = computed(() =>
    this._users().filter(u => u.role === 'active').length
  );

  // Track changes with effect
  constructor() {
    effect(() => {
      console.log('Users loaded:', this._users().length);
      console.log('Filter active:', this._filter());
    });
  }

  // Actions (mutations)
  loadUsers() {
    this._loading.set(true);
    this._error.set(null);
    this.http.get<User[]>('/api/users').subscribe({
      next: users => { this._users.set(users); this._loading.set(false); },
      error: err => { this._error.set(err.message); this._loading.set(false); },
    });
  }

  selectUser(user: User | null) { this._selected.set(user); }

  setFilter(term: string) { this._filter.set(term); }

  addUser(user: Omit<User, 'id'>) {
    this._loading.set(true);
    this.http.post<User>('/api/users', user).subscribe({
      next: created => {
        this._users.update(list => [...list, created]);
        this._loading.set(false);
      },
      error: err => { this._error.set(err.message); this._loading.set(false); },
    });
  }

  deleteUser(id: number) {
    this._users.update(list => list.filter(u => u.id !== id));
    this.http.delete(\`/api/users/\${id}\`).subscribe({
      error: () => this.loadUsers(), // refetch on failure
    });
  }
}

// 2. Component consuming the store
@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  template: \`
    <div class="toolbar">
      <input
        placeholder="Filter users..."
        [value]="store.filter()"
        (input)="store.setFilter($any($event.target).value)" />
      <span>{{ store.userCount() }} users</span>
    </div>

    @if (store.loading()) {
      <div class="spinner">Loading...</div>
    }

    @if (store.error()) {
      <div class="error">{{ store.error() }}</div>
    }

    @for (user of store.filteredUsers(); track user.id) {
      <div class="user-row"
           [class.selected]="store.selected()?.id === user.id"
           (click)="store.selectUser(user)">
        <span>{{ user.name }}</span>
        <button (click)="store.deleteUser(user.id); $event.stopPropagation()">
          Delete
        </button>
      </div>
    } @empty {
      <p>No users match your filter.</p>
    }
  \`
})
export class UserDashboardComponent implements OnInit {
  store = inject(UserStore);

  ngOnInit() {
    this.store.loadUsers();
  }
}

// 3. toSignal â€” Observable to Signal bridge
@Component({
  selector: 'app-live-clock',
  standalone: true,
  template: \`<p>{{ time() }}</p>\`
})
export class LiveClockComponent {
  time = toSignal(
    interval(1000).pipe(
      map(() => new Date().toLocaleTimeString())
    ),
    { initialValue: new Date().toLocaleTimeString() }
  );
}

// 4. toObservable â€” Signal to Observable (for RxJS operators)
@Component({
  selector: 'app-search-with-signals',
  standalone: true,
  template: \`
    <input (input)="query.set($any($event.target).value)" />
    @for (r of results(); track r.id) { <div>{{ r.name }}</div> }
  \`
})
export class SearchWithSignalsComponent {
  private http = inject(HttpClient);
  query = signal('');

  // Convert signal to observable for debounce, then back to signal
  results = toSignal(
    toObservable(this.query).pipe(
      debounceTime(300),
      switchMap(q =>
        q.length > 2
          ? this.http.get<any[]>(\`/api/search?q=\${q}\`)
          : of([])
      )
    ),
    { initialValue: [] }
  );
}`,
    practice: "Build a TodoStore service using signals: state includes todos (id, title, completed, priority), a filter signal ('all'|'active'|'completed'), and a sort signal ('date'|'priority'). Expose computed filteredTodos that applies both filter and sort. Include methods: add, toggle, remove, clearCompleted. Wire it to a TodoListComponent.",
    solution: `import { Injectable, signal, computed } from '@angular/core';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

type Filter = 'all' | 'active' | 'completed';
type Sort = 'date' | 'priority';

@Injectable({ providedIn: 'root' })
export class TodoStore {
  private _todos = signal<Todo[]>([]);
  private _filter = signal<Filter>('all');
  private _sort = signal<Sort>('date');
  private nextId = 1;

  readonly filter = this._filter.asReadonly();
  readonly sort = this._sort.asReadonly();
  readonly totalCount = computed(() => this._todos().length);
  readonly activeCount = computed(() =>
    this._todos().filter(t => !t.completed).length
  );

  readonly filteredTodos = computed(() => {
    let items = this._todos();
    const f = this._filter();
    if (f === 'active') items = items.filter(t => !t.completed);
    if (f === 'completed') items = items.filter(t => t.completed);

    const s = this._sort();
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return [...items].sort((a, b) =>
      s === 'priority'
        ? priorityOrder[a.priority] - priorityOrder[b.priority]
        : b.createdAt.getTime() - a.createdAt.getTime()
    );
  });

  add(title: string, priority: Todo['priority'] = 'medium') {
    this._todos.update(list => [...list, {
      id: this.nextId++, title, completed: false,
      priority, createdAt: new Date(),
    }]);
  }

  toggle(id: number) {
    this._todos.update(list =>
      list.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    );
  }

  remove(id: number) {
    this._todos.update(list => list.filter(t => t.id !== id));
  }

  setFilter(f: Filter) { this._filter.set(f); }
  setSort(s: Sort) { this._sort.set(s); }
  clearCompleted() { this._todos.update(list => list.filter(t => !t.completed)); }
}`,
  },
  {
    time: "Hour 10",
    title: "Testing â€” Unit Tests, Component Tests & E2E",
    concept: [
      "**Angular CLI generates test files automatically.** Every component/service gets a `.spec.ts` file. Angular uses **Jasmine** (test framework) + **Karma** (test runner) by default. Run: `ng test` (watch mode), `ng test --code-coverage`. Modern alternative: **Jest** with `@angular-builders/jest`. E2E with **Cypress** or **Playwright**: `ng e2e`.",
      "**TestBed** configures a testing module. `TestBed.configureTestingModule({ imports: [MyComponent], providers: [{ provide: UserService, useValue: mockService }] })`. Create component: `const fixture = TestBed.createComponent(MyComponent); const component = fixture.componentInstance;`. Detect changes: `fixture.detectChanges()`. Always call `detectChanges()` after setup.",
      "**Service testing** is straightforward: `const service = TestBed.inject(UserService);`. Mock HttpClient with `provideHttpClientTesting()` and `HttpTestingController`: `const httpMock = TestBed.inject(HttpTestingController);`. After calling the service method, flush the request: `httpMock.expectOne('/api/users').flush(mockUsers);`. Verify: `httpMock.verify();`.",
      "**Component testing:** Test template rendering: `fixture.nativeElement.querySelector('h1').textContent`. Test user interaction: `button.click(); fixture.detectChanges();`. Test inputs: `component.name = 'Alice'; fixture.detectChanges();`. Test outputs: `component.saved.subscribe(val => expect(val).toBe(...));`. Use `By.css()` for queries: `fixture.debugElement.query(By.css('.error'))`.",
      "**Mocking strategies:** Use `jasmine.createSpyObj('Name', ['method1', 'method2'])` for service mocks. Or create manual mocks: `const mockRouter = { navigate: jasmine.createSpy() };`. For complex mocks, use `Partial<Service>` with only needed methods. **HttpTestingController** is the standard way to test HTTP calls â€” never mock HttpClient directly.",
      "**E2E testing** with Cypress/Playwright tests the full user flow. Playwright example: `await page.goto('/login'); await page.fill('#email', 'admin@test.com'); await page.click('button[type=submit]'); await expect(page.locator('h1')).toContainText('Dashboard');`. E2E tests verify routing, guards, API integration, and form submission end-to-end.",
    ],
    code: `// === Angular Testing ===

// 1. Service Test with HttpTestingController
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController }
  from '@angular/common/http/testing';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify()); // ensure no outstanding requests

  it('should fetch all users', () => {
    const mockUsers = [
      { id: 1, name: 'Alice', email: 'alice@test.com', role: 'admin' },
      { id: 2, name: 'Bob', email: 'bob@test.com', role: 'user' },
    ];

    service.getAll().subscribe(response => {
      expect(response.content.length).toBe(2);
      expect(response.content[0].name).toBe('Alice');
    });

    const req = httpMock.expectOne('/api/users?page=0&size=10');
    expect(req.request.method).toBe('GET');
    req.flush({ content: mockUsers, totalElements: 2, totalPages: 1, number: 0 });
  });

  it('should handle errors', () => {
    service.getById(999).subscribe({
      error: err => expect(err.message).toContain('error'),
    });
    httpMock.expectOne('/api/users/999')
      .flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
  });
});

// 2. Component Test
describe('TaskListComponent', () => {
  let fixture: ComponentFixture<TaskListComponent>;
  let component: TaskListComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render task list', () => {
    const taskCards = fixture.nativeElement.querySelectorAll('.task-card');
    expect(taskCards.length).toBe(3);
  });

  it('should toggle task completion', () => {
    const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]');
    checkbox.click();
    fixture.detectChanges();

    expect(component.tasks()[0].completed).toBe(true);
  });

  it('should delete a task', () => {
    const deleteBtn = fixture.nativeElement.querySelector('button');
    deleteBtn.click();
    fixture.detectChanges();

    expect(component.tasks().length).toBe(2);
  });

  it('should show empty state when no tasks', () => {
    component.tasks.set([]);
    fixture.detectChanges();

    const empty = fixture.nativeElement.querySelector('.empty');
    expect(empty.textContent).toContain('No tasks yet');
  });
});

// 3. Component with mocked service
describe('UserListComponent', () => {
  const mockUserService = jasmine.createSpyObj('UserService', ['getAll']);

  beforeEach(async () => {
    mockUserService.getAll.and.returnValue(of({
      content: [{ id: 1, name: 'Test User', email: 't@t.com', role: 'user' }],
    }));

    await TestBed.configureTestingModule({
      imports: [UserListComponent],
      providers: [
        { provide: UserService, useValue: mockUserService },
      ],
    }).compileComponents();
  });

  it('should load users on init', () => {
    const fixture = TestBed.createComponent(UserListComponent);
    fixture.detectChanges();

    expect(mockUserService.getAll).toHaveBeenCalled();
    const name = fixture.nativeElement.querySelector('h3');
    expect(name.textContent).toBe('Test User');
  });
});

// 4. Guard Test
describe('authGuard', () => {
  it('should allow access when authenticated', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isAuthenticated: () => true } },
        { provide: Router, useValue: { createUrlTree: jasmine.createSpy() } },
      ],
    });

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url: '/dashboard' } as any)
    );
    expect(result).toBe(true);
  });
});`,
    practice: "Write tests for the RegistrationComponent from Hour 6: (1) Test that the form starts invalid. (2) Test that filling all fields correctly makes the form valid. (3) Test the password match cross-validator. (4) Test adding/removing phone numbers in the FormArray. (5) Test form submission emits correct values.",
    solution: `describe('RegistrationComponent', () => {
  let component: RegistrationComponent;
  let fixture: ComponentFixture<RegistrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrationComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(RegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should start with invalid form', () => {
    expect(component.form.valid).toBeFalse();
  });

  it('should validate when filled correctly', () => {
    component.form.patchValue({
      name: 'Alice',
      email: 'alice@test.com',
      passwords: { password: 'Password1!', confirmPassword: 'Password1!' },
      role: 'user',
    });
    expect(component.form.valid).toBeTrue();
  });

  it('should fail on password mismatch', () => {
    component.form.get('passwords')?.patchValue({
      password: 'abcd1234',
      confirmPassword: 'different',
    });
    expect(component.form.get('passwords')?.hasError('passwordMismatch'))
      .toBeTrue();
  });

  it('should add and remove phones', () => {
    expect(component.phoneNumbers.length).toBe(1);
    component.addPhone();
    expect(component.phoneNumbers.length).toBe(2);
    component.removePhone(0);
    expect(component.phoneNumbers.length).toBe(1);
  });
});`,
  },
  {
    time: "Hour 11",
    title: "Production Bootstrapping & Deployment",
    concept: [
      "**Creating a production Angular project:** `ng new my-enterprise-app --standalone --routing --style=scss --ssr=false --skip-tests=false`. Configure strict TypeScript: `strict: true` in tsconfig. Set up path aliases: `\"@core/*\": [\"src/app/core/*\"]`, `\"@features/*\": [\"src/app/features/*\"]`, `\"@shared/*\": [\"src/app/shared/*\"]`. This keeps imports clean: `import { UserService } from '@core/services/user.service';`.",
      "**Project folder structure:** `src/app/core/` â€” singleton services, guards, interceptors, models. `src/app/shared/` â€” reusable components, pipes, directives. `src/app/features/` â€” feature folders (users/, products/, admin/). `src/app/layouts/` â€” layout components (main-layout, auth-layout). `src/environments/` â€” environment-specific config. Each feature folder contains its own components, services, and routes.",
      "**Performance optimization:** (1) Lazy-load all feature routes. (2) Use `@defer` blocks (Angular 17+) for below-the-fold content: `@defer (on viewport) { <heavy-component /> } @placeholder { <skeleton /> }`. (3) OnPush change detection everywhere. (4) `trackBy` / track in @for loops. (5) Preload strategy: `provideRouter(routes, withPreloading(PreloadAllModules))`. (6) Image optimization: `NgOptimizedImage` directive.",
      "**Angular deployment:** `ng build --configuration=production` generates optimized bundle in `dist/`. Deploy to: **Nginx** (configure SPA fallback to index.html), **AWS S3 + CloudFront**, **Docker** (multi-stage build). Key nginx config: `try_files $uri $uri/ /index.html;`. Enable gzip, cache static assets with long max-age, use content hashing for cache busting (Angular CLI does this automatically).",
      "**Docker multi-stage build:** Stage 1: `FROM node:20-alpine AS build` â†’ install deps, run `ng build --configuration=production`. Stage 2: `FROM nginx:alpine` â†’ copy dist output to `/usr/share/nginx/html/`. This produces a tiny production image (~25MB). Add `.dockerignore` to exclude `node_modules/` from build context.",
      "**CORS and proxy configuration:** During development, proxy API requests to avoid CORS: create `proxy.conf.json`: `{ \"/api\": { \"target\": \"http://localhost:8080\", \"secure\": false } }`. Run with `ng serve --proxy-config proxy.conf.json`. In production, configure the backend (Spring Boot) CORS: `@CrossOrigin(origins = \"https://myapp.com\")` or use a reverse proxy (Nginx) to serve both frontend and API on the same domain.",
    ],
    code: `// === Production Angular Setup ===

// 1. Project Structure
// src/
//   app/
//     core/                        # Singleton services
//       services/
//         auth.service.ts
//         api.service.ts
//       guards/
//         auth.guard.ts
//         role.guard.ts
//       interceptors/
//         auth.interceptor.ts
//         error.interceptor.ts
//       models/
//         user.model.ts
//         api-response.model.ts
//     shared/                      # Reusable pieces
//       components/
//         modal/
//         card/
//         table/
//       directives/
//         highlight.directive.ts
//       pipes/
//         truncate.pipe.ts
//         time-ago.pipe.ts
//     features/                    # Feature modules
//       users/
//         user-list.component.ts
//         user-detail.component.ts
//         user.service.ts
//         user.routes.ts
//       products/
//         ...
//       admin/
//         admin-layout.component.ts
//         admin.routes.ts
//     layouts/
//       main-layout.component.ts
//       auth-layout.component.ts
//     app.component.ts
//     app.config.ts
//     app.routes.ts
//   environments/
//     environment.ts
//     environment.prod.ts
//   index.html
//   styles.scss

// 2. App Configuration (app.config.ts)
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules,
         withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),     // preload lazy routes
      withComponentInputBinding(),            // bind route params to inputs
    ),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor]),
    ),
    provideAnimationsAsync(),
  ],
};

// 3. Environment Configuration
// environment.ts (development)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  wsUrl: 'ws://localhost:8080/ws',
};

// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: '/api',
  wsUrl: '/ws',
};

// 4. Deferred Views (Angular 17+) â€” lazy-load content
// @Component({
//   template: \`
//     <h1>Dashboard</h1>
//     <app-header />
//
//     @defer (on viewport) {
//       <app-analytics-chart />   <!-- loaded when scrolled into view -->
//     } @placeholder {
//       <div class="skeleton chart-skeleton"></div>
//     } @loading (minimum 500ms) {
//       <div class="spinner">Loading chart...</div>
//     } @error {
//       <p>Failed to load chart</p>
//     }
//
//     @defer (on idle) {
//       <app-recommendations />   <!-- loaded when browser is idle -->
//     }
//
//     @defer (on interaction) {
//       <app-comments />          <!-- loaded on first user interaction -->
//     } @placeholder {
//       <button>Load Comments</button>
//     }
//   \`
// })

// 5. Dockerfile (multi-stage build)
// --- Dockerfile ---
// FROM node:20-alpine AS build
// WORKDIR /app
// COPY package*.json ./
// RUN npm ci
// COPY . .
// RUN npx ng build --configuration=production
//
// FROM nginx:alpine
// COPY --from=build /app/dist/my-app/browser /usr/share/nginx/html
// COPY nginx.conf /etc/nginx/conf.d/default.conf
// EXPOSE 80
// CMD ["nginx", "-g", "daemon off;"]

// 6. nginx.conf for SPA routing
// server {
//   listen 80;
//   root /usr/share/nginx/html;
//   index index.html;
//
//   location / {
//     try_files $uri $uri/ /index.html;
//   }
//
//   location /api/ {
//     proxy_pass http://backend:8080;
//     proxy_set_header Host $host;
//     proxy_set_header X-Real-IP $remote_addr;
//   }
//
//   location ~* \\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?)$ {
//     expires 1y;
//     add_header Cache-Control "public, immutable";
//   }
//
//   gzip on;
//   gzip_types text/css application/javascript application/json;
// }

// 7. Proxy Config for Development
// proxy.conf.json
// {
//   "/api": {
//     "target": "http://localhost:8080",
//     "secure": false,
//     "changeOrigin": true
//   }
// }
// Run: ng serve --proxy-config proxy.conf.json`,
    practice: "Set up a complete production Angular project structure: create the folder hierarchy, configure path aliases in tsconfig.json, set up environments, create a Dockerfile and nginx.conf, and configure proxy for development. Add a health check component that pings the backend API.",
    solution: `// tsconfig.json paths
// {
//   "compilerOptions": {
//     "paths": {
//       "@core/*": ["src/app/core/*"],
//       "@shared/*": ["src/app/shared/*"],
//       "@features/*": ["src/app/features/*"],
//       "@env": ["src/environments/environment"]
//     }
//   }
// }

// health-check.component.ts
import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env';

@Component({
  selector: 'app-health',
  standalone: true,
  template: \\\`
    <div [class]="status()">
      <p>API: {{ status() }}</p>
      <p>URL: {{ apiUrl }}</p>
      <button (click)="check()">Refresh</button>
    </div>
  \\\`
})
export class HealthCheckComponent {
  private http = inject(HttpClient);
  apiUrl = environment.apiUrl;
  status = signal('checking...');

  ngOnInit() { this.check(); }

  check() {
    this.status.set('checking...');
    this.http.get(this.apiUrl + '/health').subscribe({
      next: () => this.status.set('healthy'),
      error: () => this.status.set('unhealthy'),
    });
  }
}`,
  },
  {
    time: "Hour 12",
    title: "Angular + Spring Boot Integration â€” Full-Stack Application",
    concept: [
      "**Architecture overview:** Angular frontend (port 4200) communicates with Spring Boot backend (port 8080) via REST API. In development, Angular's proxy forwards `/api/*` to `localhost:8080`. In production, Nginx serves Angular's static files AND reverse-proxies API requests to Spring Boot. Both run as Docker containers orchestrated by Docker Compose.",
      "**Spring Boot REST API setup:** Use Spring Initializr with: Spring Web, Spring Data JPA, Spring Security, PostgreSQL Driver, Lombok, Validation. Configure: `@RestController @RequestMapping(\"/api/v1/users\")`. Return DTOs (not entities) using `record UserDto(Long id, String name, String email)`. Use `@Valid` for request validation, `ResponseEntity` for proper HTTP status codes.",
      "**JWT Authentication flow:** (1) User posts credentials to `/api/auth/login`. (2) Spring Boot validates, generates JWT using `io.jsonwebtoken:jjwt`. (3) Angular stores token in localStorage/memory. (4) Angular's auth interceptor adds `Authorization: Bearer <token>` to every request. (5) Spring Security's `JwtAuthenticationFilter` validates token on each request. Use refresh tokens for production.",
      "**CORS configuration in Spring Boot:** `@Configuration public class CorsConfig implements WebMvcConfigurer { @Override public void addCorsMappings(CorsRegistry registry) { registry.addMapping(\"/api/**\").allowedOrigins(\"http://localhost:4200\").allowedMethods(\"*\").allowCredentials(true); } }`. In production, set allowed origins to your actual domain.",
      "**Data flow pattern:** Angular Component â†’ Service (HttpClient) â†’ Interceptor (auth token) â†’ Spring Boot Controller â†’ Service â†’ Repository â†’ Database. Errors flow back through `@ControllerAdvice` exception handler â†’ Angular error interceptor â†’ component error state. Use consistent error response format: `{ status, message, errors[] }`.",
      "**Docker Compose orchestration:** Define 3 services: `db` (PostgreSQL), `backend` (Spring Boot with JDK 21), `frontend` (Angular + Nginx). Backend depends on db, frontend depends on backend. Use Docker networks for service discovery. Environment variables configure database URL, JWT secret, and API URL. A single `docker compose up` starts the entire stack.",
    ],
    code: `// ================================================================
// FULL-STACK: Angular + Spring Boot + PostgreSQL + Docker
// ================================================================

// === SPRING BOOT BACKEND ===

// --- Entity (User.java) ---
// @Entity
// @Table(name = "users")
// @Data @NoArgsConstructor @AllArgsConstructor @Builder
// public class User {
//     @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
//     private Long id;
//
//     @Column(nullable = false)
//     private String name;
//
//     @Column(nullable = false, unique = true)
//     private String email;
//
//     @Column(nullable = false)
//     private String password;
//
//     @Enumerated(EnumType.STRING)
//     private Role role = Role.USER;
//
//     @CreationTimestamp
//     private LocalDateTime createdAt;
// }

// --- DTO Records ---
// public record UserDto(Long id, String name, String email, Role role,
//                        LocalDateTime createdAt) {
//     public static UserDto from(User user) {
//         return new UserDto(user.getId(), user.getName(),
//             user.getEmail(), user.getRole(), user.getCreatedAt());
//     }
// }
//
// public record CreateUserRequest(
//     @NotBlank String name,
//     @Email @NotBlank String email,
//     @Size(min = 8) String password
// ) {}
//
// public record LoginRequest(
//     @Email @NotBlank String email,
//     @NotBlank String password
// ) {}
//
// public record AuthResponse(String token, UserDto user) {}

// --- REST Controller (UserController.java) ---
// @RestController
// @RequestMapping("/api/v1/users")
// @RequiredArgsConstructor
// public class UserController {
//     private final UserService userService;
//
//     @GetMapping
//     public ResponseEntity<Page<UserDto>> getAll(
//             @RequestParam(defaultValue = "0") int page,
//             @RequestParam(defaultValue = "10") int size) {
//         return ResponseEntity.ok(
//             userService.findAll(PageRequest.of(page, size))
//                 .map(UserDto::from)
//         );
//     }
//
//     @GetMapping("/{id}")
//     public ResponseEntity<UserDto> getById(@PathVariable Long id) {
//         return ResponseEntity.ok(
//             UserDto.from(userService.findById(id))
//         );
//     }
//
//     @PostMapping
//     public ResponseEntity<UserDto> create(
//             @Valid @RequestBody CreateUserRequest request) {
//         User user = userService.create(request);
//         return ResponseEntity.status(HttpStatus.CREATED)
//             .body(UserDto.from(user));
//     }
//
//     @PutMapping("/{id}")
//     public ResponseEntity<UserDto> update(
//             @PathVariable Long id,
//             @Valid @RequestBody UpdateUserRequest request) {
//         return ResponseEntity.ok(
//             UserDto.from(userService.update(id, request))
//         );
//     }
//
//     @DeleteMapping("/{id}")
//     public ResponseEntity<Void> delete(@PathVariable Long id) {
//         userService.delete(id);
//         return ResponseEntity.noContent().build();
//     }
//
//     @GetMapping("/search")
//     public ResponseEntity<List<UserDto>> search(@RequestParam String q) {
//         return ResponseEntity.ok(
//             userService.search(q).stream().map(UserDto::from).toList()
//         );
//     }
// }

// --- Auth Controller ---
// @RestController
// @RequestMapping("/api/auth")
// @RequiredArgsConstructor
// public class AuthController {
//     private final AuthService authService;
//
//     @PostMapping("/login")
//     public ResponseEntity<AuthResponse> login(
//             @Valid @RequestBody LoginRequest request) {
//         return ResponseEntity.ok(authService.login(request));
//     }
//
//     @PostMapping("/register")
//     public ResponseEntity<AuthResponse> register(
//             @Valid @RequestBody CreateUserRequest request) {
//         return ResponseEntity.status(HttpStatus.CREATED)
//             .body(authService.register(request));
//     }
// }

// --- Global Exception Handler ---
// @RestControllerAdvice
// public class GlobalExceptionHandler {
//     @ExceptionHandler(EntityNotFoundException.class)
//     public ResponseEntity<ErrorResponse> handleNotFound(EntityNotFoundException ex) {
//         return ResponseEntity.status(404).body(
//             new ErrorResponse(404, ex.getMessage(), List.of())
//         );
//     }
//
//     @ExceptionHandler(MethodArgumentNotValidException.class)
//     public ResponseEntity<ErrorResponse> handleValidation(
//             MethodArgumentNotValidException ex) {
//         var errors = ex.getFieldErrors().stream()
//             .map(e -> e.getField() + ": " + e.getDefaultMessage())
//             .toList();
//         return ResponseEntity.badRequest().body(
//             new ErrorResponse(400, "Validation failed", errors)
//         );
//     }
// }
//
// public record ErrorResponse(int status, String message, List<String> errors) {}

// --- CORS Configuration ---
// @Configuration
// public class CorsConfig implements WebMvcConfigurer {
//     @Override
//     public void addCorsMappings(CorsRegistry registry) {
//         registry.addMapping("/api/**")
//             .allowedOrigins("http://localhost:4200")
//             .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
//             .allowedHeaders("*")
//             .allowCredentials(true)
//             .maxAge(3600);
//     }
// }

// === ANGULAR FRONTEND ===

// 1. Auth Service (auth.service.ts)
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

interface AuthResponse {
  token: string;
  user: { id: number; name: string; email: string; role: string };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _user = signal<AuthResponse['user'] | null>(null);
  private _token = signal<string | null>(localStorage.getItem('token'));

  user = this._user.asReadonly();
  isAuthenticated = computed(() => !!this._token());
  isAdmin = computed(() => this._user()?.role === 'ADMIN');

  login(email: string, password: string) {
    return this.http.post<AuthResponse>('/api/auth/login', { email, password })
      .pipe(tap(res => {
        localStorage.setItem('token', res.token);
        this._token.set(res.token);
        this._user.set(res.user);
      }));
  }

  register(name: string, email: string, password: string) {
    return this.http.post<AuthResponse>('/api/auth/register',
      { name, email, password }
    ).pipe(tap(res => {
      localStorage.setItem('token', res.token);
      this._token.set(res.token);
      this._user.set(res.user);
    }));
  }

  logout() {
    localStorage.removeItem('token');
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null { return this._token(); }

  hasRole(role: string): boolean {
    return this._user()?.role === role;
  }
}

// 2. Auth Interceptor
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: \`Bearer \${token}\` }
    });
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        auth.logout(); // token expired
      }
      return throwError(() => err);
    })
  );
};

// 3. User Management Component
@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: \`
    <div class="container">
      <h1>User Management</h1>

      <!-- Create User Form -->
      <form [formGroup]="createForm" (ngSubmit)="createUser()" class="create-form">
        <input formControlName="name" placeholder="Name" />
        <input formControlName="email" placeholder="Email" type="email" />
        <input formControlName="password" placeholder="Password" type="password" />
        <button [disabled]="createForm.invalid || loading()">
          {{ loading() ? 'Creating...' : 'Add User' }}
        </button>
      </form>

      <!-- Search -->
      <input
        placeholder="Search users..."
        [value]="searchTerm()"
        (input)="searchTerm.set($any($event.target).value)" />

      <!-- User Table -->
      @if (loading()) {
        <div class="spinner">Loading...</div>
      }

      @if (error()) {
        <div class="error">
          {{ error() }}
          <button (click)="loadUsers()">Retry</button>
        </div>
      }

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (user of filteredUsers(); track user.id) {
            <tr>
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.role }}</td>
              <td>{{ user.createdAt | date:'short' }}</td>
              <td>
                <button (click)="editUser(user)">Edit</button>
                <button (click)="deleteUser(user.id)" class="danger">Delete</button>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="5">No users found</td></tr>
          }
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="pagination">
        <button [disabled]="page() === 0" (click)="page.update(p => p - 1)">
          Previous
        </button>
        <span>Page {{ page() + 1 }} of {{ totalPages() }}</span>
        <button [disabled]="page() >= totalPages() - 1"
                (click)="page.update(p => p + 1)">
          Next
        </button>
      </div>
    </div>
  \`
})
export class UserManagementComponent implements OnInit {
  private userService = inject(UserService);
  private fb = inject(FormBuilder);

  users = signal<User[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  searchTerm = signal('');
  page = signal(0);
  totalPages = signal(1);

  filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return term
      ? this.users().filter(u =>
          u.name.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term))
      : this.users();
  });

  createForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit() { this.loadUsers(); }

  loadUsers() {
    this.loading.set(true);
    this.error.set(null);
    this.userService.getAll(this.page(), 10).subscribe({
      next: res => {
        this.users.set(res.content);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err.error?.message || 'Failed to load users');
        this.loading.set(false);
      },
    });
  }

  createUser() {
    if (this.createForm.valid) {
      this.loading.set(true);
      this.userService.create(this.createForm.getRawValue()).subscribe({
        next: () => {
          this.createForm.reset();
          this.loadUsers();
        },
        error: err => this.error.set(err.error?.message || 'Create failed'),
      });
    }
  }

  deleteUser(id: number) {
    if (confirm('Are you sure?')) {
      this.userService.delete(id).subscribe(() => this.loadUsers());
    }
  }
}

// === DOCKER COMPOSE ===
// docker-compose.yml
// version: '3.8'
// services:
//   db:
//     image: postgres:16-alpine
//     environment:
//       POSTGRES_DB: myapp
//       POSTGRES_USER: postgres
//       POSTGRES_PASSWORD: secret
//     ports: ["5432:5432"]
//     volumes: [pgdata:/var/lib/postgresql/data]
//
//   backend:
//     build:
//       context: ./backend
//       dockerfile: Dockerfile
//     environment:
//       SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/myapp
//       SPRING_DATASOURCE_USERNAME: postgres
//       SPRING_DATASOURCE_PASSWORD: secret
//       JWT_SECRET: myJwtSecretKey123456789012345678
//     ports: ["8080:8080"]
//     depends_on: [db]
//
//   frontend:
//     build:
//       context: ./frontend
//       dockerfile: Dockerfile
//     ports: ["80:80"]
//     depends_on: [backend]
//
// volumes:
//   pgdata:`,
    practice: "Extend the full-stack setup: Add a TaskController (Spring Boot) and TaskService (Angular) for managing tasks with title, description, status (TODO/IN_PROGRESS/DONE), and assignee (User reference). Include: paginated list, create form with validation, status toggle, filter by status, and optimistic UI update on status change.",
    solution: `// --- Spring Boot: TaskController.java ---
// @RestController
// @RequestMapping("/api/v1/tasks")
// @RequiredArgsConstructor
// public class TaskController {
//     private final TaskService taskService;
//
//     @GetMapping
//     public Page<TaskDto> getAll(
//             @RequestParam(defaultValue = "0") int page,
//             @RequestParam(defaultValue = "10") int size,
//             @RequestParam(required = false) String status) {
//         if (status != null) {
//             return taskService.findByStatus(
//                 TaskStatus.valueOf(status), PageRequest.of(page, size))
//                 .map(TaskDto::from);
//         }
//         return taskService.findAll(PageRequest.of(page, size))
//             .map(TaskDto::from);
//     }
//
//     @PostMapping
//     @ResponseStatus(HttpStatus.CREATED)
//     public TaskDto create(@Valid @RequestBody CreateTaskRequest req) {
//         return TaskDto.from(taskService.create(req));
//     }
//
//     @PatchMapping("/{id}/status")
//     public TaskDto updateStatus(@PathVariable Long id,
//             @RequestBody Map<String, String> body) {
//         return TaskDto.from(
//             taskService.updateStatus(id,
//                 TaskStatus.valueOf(body.get("status")))
//         );
//     }
// }

// --- Angular: task.service.ts ---
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Task {
  id: number;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  assignee?: { id: number; name: string };
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private url = '/api/v1/tasks';

  tasks = signal<Task[]>([]);
  filter = signal<string>('');
  loading = signal(false);

  filtered = computed(() => {
    const f = this.filter();
    return f ? this.tasks().filter(t => t.status === f) : this.tasks();
  });

  load(page = 0) {
    this.loading.set(true);
    this.http.get<any>(this.url, { params: { page, size: 20 } })
      .subscribe({
        next: res => { this.tasks.set(res.content); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  // Optimistic update
  toggleStatus(task: Task) {
    const next = task.status === 'TODO' ? 'IN_PROGRESS'
      : task.status === 'IN_PROGRESS' ? 'DONE' : 'TODO';

    // Update UI immediately
    this.tasks.update(list =>
      list.map(t => t.id === task.id ? { ...t, status: next } : t)
    );

    // Sync with server
    this.http.patch(\\\`\${this.url}/\${task.id}/status\\\`, { status: next })
      .subscribe({ error: () => this.load() }); // rollback on failure
  }
}`,
  },
];
