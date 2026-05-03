<?php
/**
 * Plugin Name: Todo Manager
 * Description: Interactive Todo List Block + Admin Dashboard
 * Version: 1.0.0
 * Author: Todo Manager
 * Text Domain: todo-manager
 */

defined( 'ABSPATH' ) || exit;

define( 'TODO_MANAGER_VERSION', '1.0.0' );
define( 'TODO_MANAGER_PATH', plugin_dir_path( __FILE__ ) );
define( 'TODO_MANAGER_URL', plugin_dir_url( __FILE__ ) );

require_once TODO_MANAGER_PATH . 'includes/class-todo-cpt.php';
require_once TODO_MANAGER_PATH . 'includes/class-todo-rest-api.php';
require_once TODO_MANAGER_PATH . 'includes/class-todo-block.php';
require_once TODO_MANAGER_PATH . 'includes/class-todo-admin.php';

function todo_manager_init() {
	new Todo_CPT();
	new Todo_REST_API();
	new Todo_Block();
	new Todo_Admin();
}
add_action( 'plugins_loaded', 'todo_manager_init' );

register_activation_hook( __FILE__, 'todo_manager_activate' );
function todo_manager_activate() {
	flush_rewrite_rules();
}
