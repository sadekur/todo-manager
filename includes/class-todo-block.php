<?php
defined( 'ABSPATH' ) || exit;

class Todo_Block {

	public function __construct() {
		add_action( 'init', array( $this, 'register_block' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_frontend' ) );
	}

	public function register_block() {
		// Register editor script
		wp_register_script(
			'todo-manager-block',
			TODO_MANAGER_URL . 'assets/js/block.js',
			array( 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-api-fetch', 'wp-i18n' ),
			TODO_MANAGER_VERSION,
			true
		);

		// Register editor style
		wp_register_style(
			'todo-manager-block-editor',
			TODO_MANAGER_URL . 'assets/css/block-editor.css',
			array(),
			TODO_MANAGER_VERSION
		);

		// Register frontend style
		wp_register_style(
			'todo-manager-frontend',
			TODO_MANAGER_URL . 'assets/css/frontend.css',
			array(),
			TODO_MANAGER_VERSION
		);

		register_block_type( 'todo-manager/todo-list', array(
			'editor_script'   => 'todo-manager-block',
			'editor_style'    => 'todo-manager-block-editor',
			'style'           => 'todo-manager-frontend',
			'render_callback' => array( $this, 'render_block' ),
		) );
	}

	public function enqueue_frontend() {
		if ( has_block( 'todo-manager/todo-list' ) ) {
			wp_enqueue_script(
				'todo-manager-frontend',
				TODO_MANAGER_URL . 'assets/js/frontend.js',
				array(),
				TODO_MANAGER_VERSION,
				true
			);

			wp_localize_script( 'todo-manager-frontend', 'todoManagerData', array(
				'apiUrl'   => rest_url( 'todo-manager/v1/todos' ),
				'nonce'    => wp_create_nonce( 'wp_rest' ),
			) );
		}
	}

	public function render_block( $attributes ) {
		return '<div class="todo-manager-block" id="todo-manager-app" data-loaded="false">
			<div class="todo-manager-loading">Loading todos...</div>
		</div>';
	}
}
