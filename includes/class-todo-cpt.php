<?php
defined( 'ABSPATH' ) || exit;

class Todo_CPT {

	const POST_TYPE = 'todo_item';

	public function __construct() {
		add_action( 'init', array( $this, 'register_post_type' ) );
		add_action( 'init', array( $this, 'register_meta' ) );
	}

	public function register_post_type() {
		register_post_type(
			self::POST_TYPE,
			array(
				'label'        => __( 'Todos', 'todo-manager' ),
				'public'       => false,
				'show_ui'      => false,
				'show_in_rest' => true,
				'rest_base'    => 'todos',
				'supports'     => array( 'title', 'custom-fields' ),
				'capabilities' => array(
					'create_posts' => 'manage_options',
				),
				'map_meta_cap' => true,
			)
		);
	}

	public function register_meta() {
		register_post_meta(
			self::POST_TYPE,
			'_todo_completed',
			array(
				'single'        => true,
				'type'          => 'boolean',
				'default'       => false,
				'show_in_rest'  => true,
				'auth_callback' => function() {
					return current_user_can( 'manage_options' );
				},
			)
		);
	}
}
