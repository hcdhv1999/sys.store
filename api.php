<?php
/**
 * api.php — واجهة برمجية بسيطة للوحة متابعة المتاجر (حِرف)
 * تخزين عبر SQLite. الإجراءات: list / save / delete
 * المصادقة عبر ترويسة X-Auth-Key يجب أن تطابق AUTH_KEY في config.php
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

require __DIR__ . '/config.php';

/** إرجاع رد JSON وإنهاء التنفيذ */
function respond(array $payload, int $status = 200): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** قراءة ترويسة المصادقة بشكل متوافق مع مختلف الخوادم */
function authHeader(): string {
    if (isset($_SERVER['HTTP_X_AUTH_KEY'])) {
        return (string) $_SERVER['HTTP_X_AUTH_KEY'];
    }
    if (function_exists('getallheaders')) {
        foreach (getallheaders() as $name => $value) {
            if (strcasecmp($name, 'X-Auth-Key') === 0) {
                return (string) $value;
            }
        }
    }
    return '';
}

// ── المصادقة ─────────────────────────────────────────────
if (!hash_equals(AUTH_KEY, authHeader())) {
    respond(['error' => 'غير مصرّح: مفتاح الحماية غير مطابق'], 401);
}

// ── الاتصال بقاعدة البيانات وتهيئة الجدول ────────────────
try {
    $dir = dirname(DB_PATH);
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }
    $db = new PDO('sqlite:' . DB_PATH);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->exec('CREATE TABLE IF NOT EXISTS projects (
        id         TEXT PRIMARY KEY,
        data       TEXT NOT NULL,
        updated_at INTEGER NOT NULL
    )');
} catch (Throwable $e) {
    respond(['error' => 'تعذّر فتح قاعدة البيانات: ' . $e->getMessage()], 500);
}

$action = $_GET['action'] ?? '';

try {
    switch ($action) {

        // ── قائمة كل المشاريع ────────────────────────────
        case 'list':
            $rows = $db->query('SELECT data FROM projects ORDER BY updated_at DESC')
                       ->fetchAll(PDO::FETCH_COLUMN);
            $data = [];
            foreach ($rows as $json) {
                $obj = json_decode((string) $json, true);
                if (is_array($obj)) {
                    $data[] = $obj;
                }
            }
            respond(['data' => $data]);
            // no break (respond exits)

        // ── حفظ/تحديث مشروع (upsert) ─────────────────────
        case 'save':
            $body = json_decode((string) file_get_contents('php://input'), true);
            if (!is_array($body) || empty($body['id'])) {
                respond(['error' => 'بيانات غير صالحة: المعرّف (id) مطلوب'], 400);
            }
            $id = (string) $body['id'];
            $json = json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $stmt = $db->prepare('INSERT INTO projects (id, data, updated_at)
                VALUES (:id, :data, :ts)
                ON CONFLICT(id) DO UPDATE SET data = :data2, updated_at = :ts2');
            $now = time();
            $stmt->execute([
                ':id'   => $id,
                ':data' => $json,
                ':ts'   => $now,
                ':data2'=> $json,
                ':ts2'  => $now,
            ]);
            respond(['ok' => true, 'id' => $id]);
            // no break

        // ── حذف مشروع ────────────────────────────────────
        case 'delete':
            $id = $_GET['id'] ?? '';
            if ($id === '') {
                respond(['error' => 'المعرّف (id) مطلوب للحذف'], 400);
            }
            $stmt = $db->prepare('DELETE FROM projects WHERE id = :id');
            $stmt->execute([':id' => (string) $id]);
            respond(['ok' => true]);
            // no break

        default:
            respond(['error' => 'إجراء غير معروف: ' . $action], 400);
    }
} catch (Throwable $e) {
    respond(['error' => 'خطأ في الخادم: ' . $e->getMessage()], 500);
}
