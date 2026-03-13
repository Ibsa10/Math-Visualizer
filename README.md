# 📐 Math Visualizer

A comprehensive, interactive mathematics visualization web application built with **HTML**, **CSS**, **JavaScript**, and **PHP**.

## Features

| Module | Description |
|--------|-------------|
| 📈 **Function Plotter** | Plot single/dual custom functions with zoom & hover coordinates |
| 🔷 **Geometry** | Interactive shapes with live area/perimeter calculations |
| 📊 **Statistics** | Bar/Line/Histogram charts with full statistical summary |
| 🔢 **Matrix Ops** | Addition, subtraction, multiplication, transpose, determinant, inverse |
| ∫ **Calculus** | Derivative, definite integral, Riemann sum visualization |
| 🌀 **Fractals** | Mandelbrot set, Julia set, Sierpinski triangle |
| 〰️ **Trigonometry** | Animated unit circle with all trig functions and wave |
| 🔍 **Number Theory** | Primes, factorization, GCD/LCM, Fibonacci, Sieve of Eratosthenes |

## Running the App

### Option 1: Open directly in browser (static features only)
Just open `index.html` in any modern browser. All JavaScript features work without a server.

### Option 2: With PHP backend (full features)
Requires PHP 8.0+ with a web server.

**Using PHP built-in server:**
```bash
cd math-visualizer
php -S localhost:8080
```
Then open http://localhost:8080

**Using XAMPP/WAMP/LAMP:**
Copy the `math-visualizer` folder to your `htdocs` or `www` directory and open via localhost.

## Project Structure

```
math-visualizer/
├── index.html      # Main app shell with all sections
├── style.css       # Dark/light theme styles
├── main.js         # All JavaScript visualizations
├── api.php         # PHP backend for server-side calculations
└── README.md       # This file
```

## API Endpoints (PHP)

| Action | Method | Parameters | Description |
|--------|--------|------------|-------------|
| `statistics` | POST | `data` (JSON array) | Full stats summary |
| `is_prime` | GET | `n` | Prime check |
| `factorize` | GET | `n` | Prime factorization |
| `gcd_lcm` | GET | `a`, `b` | GCD and LCM |
| `sieve` | GET | `limit` | Sieve of Eratosthenes |
| `fibonacci` | GET | `n` | Fibonacci sequence |
| `geometry` | GET | `shape`, `p1`, `p2`, `p3` | Shape calculations |
| `matrix` | POST | `op`, `matA`, `matB` | Matrix operations |
| `evaluate` | GET | `expr` | Expression evaluator |
| `convert` | GET | `value`, `from`, `to` | Unit conversion |

### Example API calls
```
GET  api.php?action=is_prime&n=97
GET  api.php?action=factorize&n=360
GET  api.php?action=gcd_lcm&a=48&b=36
GET  api.php?action=sieve&limit=100
POST api.php?action=statistics  body: data=[1,2,3,4,5]
```

## Technologies
- **HTML5 Canvas** for all visualizations
- **CSS3** with CSS custom properties for theming
- **JavaScript ES6+** with math.js library
- **PHP 8** for server-side computation
