<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$response = ['success' => false, 'error' => 'Unknown action'];

switch ($action) {

    // ===== STATISTICS =====
    case 'statistics':
        $data = json_decode($_POST['data'] ?? '[]', true);
        if (empty($data)) { echo json_encode(['error' => 'No data provided']); exit; }
        $n = count($data);
        $sorted = $data;
        sort($sorted);
        $mean = array_sum($data) / $n;
        $variance = array_sum(array_map(fn($x) => pow($x - $mean, 2), $data)) / $n;
        $std = sqrt($variance);
        $median = $n % 2 == 0 ? ($sorted[$n/2-1] + $sorted[$n/2]) / 2 : $sorted[floor($n/2)];
        $q1 = $sorted[floor($n/4)];
        $q3 = $sorted[floor(3*$n/4)];
        $freq = array_count_values($data);
        arsort($freq);
        $mode = array_keys($freq)[0];
        $response = [
            'success' => true,
            'n' => $n,
            'mean' => round($mean, 6),
            'median' => round($median, 6),
            'mode' => $mode,
            'variance' => round($variance, 6),
            'std_dev' => round($std, 6),
            'min' => min($data),
            'max' => max($data),
            'range' => max($data) - min($data),
            'q1' => $q1,
            'q3' => $q3,
            'iqr' => $q3 - $q1,
            'sum' => array_sum($data),
        ];
        break;

    // ===== PRIME CHECK =====
    case 'is_prime':
        $n = intval($_GET['n'] ?? 0);
        $response = [
            'success' => true,
            'number' => $n,
            'is_prime' => is_prime_php($n),
        ];
        break;

    // ===== PRIME FACTORIZATION =====
    case 'factorize':
        $n = intval($_GET['n'] ?? 0);
        $factors = prime_factors_php($n);
        $divisors = get_divisors_php($n);
        $response = [
            'success' => true,
            'number' => $n,
            'prime_factors' => $factors,
            'factorization' => implode(' × ', $factors),
            'divisors' => $divisors,
            'divisor_count' => count($divisors),
            'is_prime' => is_prime_php($n),
            'is_perfect' => array_sum($divisors) - $n === $n,
        ];
        break;

    // ===== GCD / LCM =====
    case 'gcd_lcm':
        $a = intval($_GET['a'] ?? 0);
        $b = intval($_GET['b'] ?? 0);
        $gcd = gcd_php($a, $b);
        $lcm = ($a * $b) / $gcd;
        $response = [
            'success' => true,
            'a' => $a,
            'b' => $b,
            'gcd' => $gcd,
            'lcm' => $lcm,
            'bezout' => bezout_php($a, $b),
        ];
        break;

    // ===== SIEVE OF ERATOSTHENES =====
    case 'sieve':
        $limit = min(intval($_GET['limit'] ?? 100), 10000);
        $primes = sieve_php($limit);
        $response = [
            'success' => true,
            'limit' => $limit,
            'primes' => $primes,
            'count' => count($primes),
        ];
        break;

    // ===== FIBONACCI =====
    case 'fibonacci':
        $n = min(intval($_GET['n'] ?? 10), 100);
        $fibs = fibonacci_php($n);
        $response = [
            'success' => true,
            'n' => $n,
            'sequence' => $fibs,
            'sum' => array_sum($fibs),
        ];
        break;

    // ===== GEOMETRY CALCULATOR =====
    case 'geometry':
        $shape = $_GET['shape'] ?? 'circle';
        $p1 = floatval($_GET['p1'] ?? 1);
        $p2 = floatval($_GET['p2'] ?? 1);
        $p3 = intval($_GET['p3'] ?? 3);
        $result = geometry_php($shape, $p1, $p2, $p3);
        $response = array_merge(['success' => true], $result);
        break;

    // ===== MATRIX OPERATIONS =====
    case 'matrix':
        $op = $_GET['op'] ?? 'add';
        $A = json_decode($_POST['matA'] ?? '[]', true);
        $B = json_decode($_POST['matB'] ?? '[]', true);
        $result = matrix_op_php($op, $A, $B);
        $response = array_merge(['success' => true], $result);
        break;

    // ===== EXPRESSION EVALUATOR =====
    case 'evaluate':
        $expr = $_GET['expr'] ?? '';
        $result = evaluate_expr($expr);
        $response = ['success' => true, 'result' => $result];
        break;

    // ===== CONVERSION =====
    case 'convert':
        $value = floatval($_GET['value'] ?? 0);
        $from = $_GET['from'] ?? 'degrees';
        $to = $_GET['to'] ?? 'radians';
        if ($from === 'degrees' && $to === 'radians') {
            $result = $value * M_PI / 180;
        } elseif ($from === 'radians' && $to === 'degrees') {
            $result = $value * 180 / M_PI;
        } else {
            $result = $value;
        }
        $response = ['success' => true, 'value' => $value, 'from' => $from, 'to' => $to, 'result' => $result];
        break;

    default:
        $response = ['success' => false, 'error' => 'Unknown action: ' . $action];
}

echo json_encode($response, JSON_PRETTY_PRINT);

// ===== HELPER FUNCTIONS =====

function is_prime_php(int $n): bool {
    if ($n < 2) return false;
    if ($n === 2) return true;
    if ($n % 2 === 0) return false;
    for ($i = 3; $i <= sqrt($n); $i += 2) {
        if ($n % $i === 0) return false;
    }
    return true;
}

function prime_factors_php(int $n): array {
    $factors = [];
    for ($i = 2; $i * $i <= $n; $i++) {
        while ($n % $i === 0) {
            $factors[] = $i;
            $n /= $i;
        }
    }
    if ($n > 1) $factors[] = $n;
    return $factors;
}

function get_divisors_php(int $n): array {
    $divs = [];
    for ($i = 1; $i <= $n; $i++) {
        if ($n % $i === 0) $divs[] = $i;
    }
    return $divs;
}

function gcd_php(int $a, int $b): int {
    while ($b) {
        [$a, $b] = [$b, $a % $b];
    }
    return abs($a);
}

function bezout_php(int $a, int $b): array {
    // Extended Euclidean Algorithm
    if ($b === 0) return ['x' => 1, 'y' => 0, 'gcd' => $a];
    $r = bezout_php($b, $a % $b);
    return [
        'x' => $r['y'],
        'y' => $r['x'] - floor($a / $b) * $r['y'],
        'gcd' => $r['gcd'],
    ];
}

function sieve_php(int $limit): array {
    $sieve = array_fill(0, $limit + 1, true);
    $sieve[0] = $sieve[1] = false;
    for ($i = 2; $i * $i <= $limit; $i++) {
        if ($sieve[$i]) {
            for ($j = $i * $i; $j <= $limit; $j += $i) {
                $sieve[$j] = false;
            }
        }
    }
    return array_keys(array_filter($sieve));
}

function fibonacci_php(int $n): array {
    if ($n <= 0) return [];
    if ($n === 1) return [0];
    $fibs = [0, 1];
    for ($i = 2; $i < $n; $i++) {
        $fibs[] = $fibs[$i-1] + $fibs[$i-2];
    }
    return $fibs;
}

function geometry_php(string $shape, float $p1, float $p2, int $p3): array {
    switch ($shape) {
        case 'circle':
            return [
                'shape' => 'Circle',
                'area' => round(M_PI * $p1 * $p1, 6),
                'perimeter' => round(2 * M_PI * $p1, 6),
                'diameter' => 2 * $p1,
                'radius' => $p1,
            ];
        case 'rectangle':
            return [
                'shape' => 'Rectangle',
                'area' => round($p1 * $p2, 6),
                'perimeter' => round(2 * ($p1 + $p2), 6),
                'diagonal' => round(sqrt($p1 ** 2 + $p2 ** 2), 6),
                'width' => $p1,
                'height' => $p2,
            ];
        case 'triangle':
            $side = sqrt(($p1/2) ** 2 + $p2 ** 2);
            return [
                'shape' => 'Triangle',
                'area' => round(0.5 * $p1 * $p2, 6),
                'perimeter' => round($p1 + 2 * $side, 6),
                'hypotenuse' => round($side, 6),
                'base' => $p1,
                'height' => $p2,
            ];
        case 'polygon':
            $sideLen = 2 * $p1 * sin(M_PI / $p3);
            return [
                'shape' => "Regular {$p3}-gon",
                'area' => round(0.5 * $p3 * $p1 * $p1 * sin(2 * M_PI / $p3), 6),
                'perimeter' => round($p3 * $sideLen, 6),
                'side_length' => round($sideLen, 6),
                'radius' => $p1,
                'sides' => $p3,
                'interior_angle' => round((($p3 - 2) * 180) / $p3, 4),
            ];
        case 'ellipse':
            $h = (($p1 - $p2) / ($p1 + $p2)) ** 2;
            $perimeter = M_PI * ($p1 + $p2) * (1 + 3 * $h / (10 + sqrt(4 - 3 * $h)));
            return [
                'shape' => 'Ellipse',
                'area' => round(M_PI * $p1 * $p2, 6),
                'perimeter' => round($perimeter, 6),
                'semi_a' => $p1,
                'semi_b' => $p2,
                'eccentricity' => round(sqrt(1 - ($p2 / $p1) ** 2), 6),
            ];
        default:
            return ['error' => 'Unknown shape'];
    }
}

function matrix_op_php(string $op, array $A, array $B): array {
    $rows_A = count($A);
    $cols_A = count($A[0] ?? []);
    $rows_B = count($B);
    $cols_B = count($B[0] ?? []);

    switch ($op) {
        case 'add':
            if ($rows_A !== $rows_B || $cols_A !== $cols_B)
                return ['error' => 'Matrices must have same dimensions for addition'];
            $result = [];
            for ($i = 0; $i < $rows_A; $i++)
                for ($j = 0; $j < $cols_A; $j++)
                    $result[$i][$j] = $A[$i][$j] + $B[$i][$j];
            return ['operation' => 'A + B', 'result' => $result];

        case 'subtract':
            if ($rows_A !== $rows_B || $cols_A !== $cols_B)
                return ['error' => 'Matrices must have same dimensions for subtraction'];
            $result = [];
            for ($i = 0; $i < $rows_A; $i++)
                for ($j = 0; $j < $cols_A; $j++)
                    $result[$i][$j] = $A[$i][$j] - $B[$i][$j];
            return ['operation' => 'A - B', 'result' => $result];

        case 'multiply':
            if ($cols_A !== $rows_B)
                return ['error' => "Cannot multiply: A columns ({$cols_A}) ≠ B rows ({$rows_B})"];
            $result = array_fill(0, $rows_A, array_fill(0, $cols_B, 0));
            for ($i = 0; $i < $rows_A; $i++)
                for ($j = 0; $j < $cols_B; $j++)
                    for ($k = 0; $k < $cols_A; $k++)
                        $result[$i][$j] += $A[$i][$k] * $B[$k][$j];
            return ['operation' => 'A × B', 'result' => $result];

        case 'transpose':
            $result = [];
            for ($i = 0; $i < $cols_A; $i++)
                for ($j = 0; $j < $rows_A; $j++)
                    $result[$i][$j] = $A[$j][$i];
            return ['operation' => 'Aᵀ', 'result' => $result];

        case 'determinant':
            if ($rows_A !== $cols_A)
                return ['error' => 'Matrix must be square for determinant'];
            $det = determinant_php($A, $rows_A);
            return ['operation' => 'det(A)', 'determinant' => round($det, 6)];

        case 'trace':
            $trace = 0;
            for ($i = 0; $i < min($rows_A, $cols_A); $i++) $trace += $A[$i][$i];
            return ['operation' => 'trace(A)', 'trace' => $trace];

        default:
            return ['error' => 'Unknown matrix operation'];
    }
}

function determinant_php(array $matrix, int $n): float {
    if ($n === 1) return $matrix[0][0];
    if ($n === 2) return $matrix[0][0] * $matrix[1][1] - $matrix[0][1] * $matrix[1][0];
    $det = 0;
    for ($c = 0; $c < $n; $c++) {
        $subMatrix = [];
        for ($i = 1; $i < $n; $i++) {
            $row = [];
            for ($j = 0; $j < $n; $j++) {
                if ($j !== $c) $row[] = $matrix[$i][$j];
            }
            $subMatrix[] = $row;
        }
        $det += pow(-1, $c) * $matrix[0][$c] * determinant_php($subMatrix, $n - 1);
    }
    return $det;
}

function evaluate_expr(string $expr): string {
    // Very basic safe evaluator - only allows math
    $expr = preg_replace('/[^0-9+\-*\/().%\s]/', '', $expr);
    try {
        $result = eval("return ($expr);");
        return is_numeric($result) ? strval(round($result, 8)) : 'Invalid';
    } catch (Throwable $e) {
        return 'Error: ' . $e->getMessage();
    }
}
