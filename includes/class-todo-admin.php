<?php
defined( 'ABSPATH' ) || exit;

class Todo_Admin {

	public function __construct() {
		add_action( 'admin_menu', array( $this, 'add_menu_page' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
	}

	public function add_menu_page() {
		add_menu_page(
			__( 'Todo Manager', 'todo-manager' ),
			__( 'Todo Manager', 'todo-manager' ),
			'manage_options',
			'todo-manager',
			array( $this, 'render_page' ),
			'dashicons-checklist',
			30
		);
	}

	public function enqueue_scripts( $hook ) {
		if ( 'toplevel_page_todo-manager' !== $hook ) {
			return;
		}

		wp_enqueue_style(
			'todo-manager-admin',
			TODO_MANAGER_URL . 'admin/css/admin.css',
			array(),
			TODO_MANAGER_VERSION
		);

		wp_enqueue_script(
			'todo-manager-admin',
			TODO_MANAGER_URL . 'admin/js/admin.js',
			array( 'wp-api-fetch', 'jquery' ),
			TODO_MANAGER_VERSION,
			true
		);

		wp_localize_script( 'todo-manager-admin', 'todoManagerAdmin', array(
			'apiUrl' => rest_url( 'todo-manager/v1/todos' ),
			'nonce'  => wp_create_nonce( 'wp_rest' ),
			'i18n'   => array(
				'confirmDelete' => __( 'Are you sure you want to delete this todo?', 'todo-manager' ),
				'saving'        => __( 'Saving...', 'todo-manager' ),
				'saved'         => __( 'Saved!', 'todo-manager' ),
				'error'         => __( 'An error occurred. Please try again.', 'todo-manager' ),
			),
		) );
	}

	public function render_page() {
		?>
		<div class="wrap todo-admin-wrap">
			<h1><?php esc_html_e( 'Todo Manager', 'todo-manager' ); ?></h1>

			<div class="todo-admin-add-form">
				<h2><?php esc_html_e( 'Add New Todo', 'todo-manager' ); ?></h2>
				<div class="todo-add-row">
					<input
						type="text"
						id="todo-new-title"
						placeholder="<?php esc_attr_e( 'Enter todo title...', 'todo-manager' ); ?>"
						class="regular-text"
						maxlength="200"
					/>
					<button id="todo-add-btn" class="button button-primary">
						<?php esc_html_e( 'Add Todo', 'todo-manager' ); ?>
					</button>
				</div>
				<div id="todo-add-error" class="notice notice-error hidden"><p></p></div>
			</div>

			<div id="todo-admin-list-wrap">
				<h2><?php esc_html_e( 'All Todos', 'todo-manager' ); ?></h2>
				<div id="todo-admin-loading" class="todo-loading-indicator">
					<?php esc_html_e( 'Loading todos...', 'todo-manager' ); ?>
				</div>
				<div id="todo-admin-empty" class="todo-empty-state hidden">
					<?php esc_html_e( 'No todos yet. Add one above!', 'todo-manager' ); ?>
				</div>
				<table class="wp-list-table widefat fixed striped" id="todo-admin-table">
					<thead>
						<tr>
							<th class="column-status"><?php esc_html_e( 'Status', 'todo-manager' ); ?></th>
							<th class="column-title"><?php esc_html_e( 'Title', 'todo-manager' ); ?></th>
							<th class="column-created"><?php esc_html_e( 'Created', 'todo-manager' ); ?></th>
							<th class="column-actions"><?php esc_html_e( 'Actions', 'todo-manager' ); ?></th>
						</tr>
					</thead>
					<tbody id="todo-admin-tbody">
					</tbody>
				</table>
			</div>

			<!-- Inline Edit Modal -->
			<div id="todo-edit-modal" class="todo-modal hidden">
				<div class="todo-modal-overlay"></div>
				<div class="todo-modal-content">
					<h2><?php esc_html_e( 'Edit Todo', 'todo-manager' ); ?></h2>
					<input type="hidden" id="todo-edit-id" />
					<label for="todo-edit-title"><?php esc_html_e( 'Title', 'todo-manager' ); ?></label>
					<input type="text" id="todo-edit-title" class="regular-text" maxlength="200" />
					<label for="todo-edit-completed"><?php esc_html_e( 'Completed', 'todo-manager' ); ?></label>
					<input type="checkbox" id="todo-edit-completed" />
					<div class="todo-modal-actions">
						<button id="todo-edit-save" class="button button-primary">
							<?php esc_html_e( 'Save Changes', 'todo-manager' ); ?>
						</button>
						<button id="todo-edit-cancel" class="button">
							<?php esc_html_e( 'Cancel', 'todo-manager' ); ?>
						</button>
					</div>
					<div id="todo-edit-error" class="notice notice-error hidden"><p></p></div>
				</div>
			</div>
		</div>
		<?php
	}
}
