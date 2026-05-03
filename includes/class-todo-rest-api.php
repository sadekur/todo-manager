<?php
defined( 'ABSPATH' ) || exit;

class Todo_REST_API {

	const NAMESPACE = 'todo-manager/v1';

	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	public function register_routes() {

		// GET /todos | POST /todos
		register_rest_route( self::NAMESPACE, '/todos', array(
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_todos' ),
				'permission_callback' => '__return_true',
			),
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'create_todo' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => $this->get_create_args(),
			),
		) );

		// GET /todos/:id | PUT /todos/:id | DELETE /todos/:id
		register_rest_route( self::NAMESPACE, '/todos/(?P<id>\d+)', array(
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_todo' ),
				'permission_callback' => '__return_true',
			),
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'update_todo' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => $this->get_update_args(),
			),
			array(
				'methods'             => WP_REST_Server::DELETABLE,
				'callback'            => array( $this, 'delete_todo' ),
				'permission_callback' => array( $this, 'check_permission' ),
			),
		) );
	}

	// ─── Callbacks ────────────────────────────────────────────────────────────

	public function get_todos( $request ) {
		$posts = get_posts( array(
			'post_type'      => Todo_CPT::POST_TYPE,
			'posts_per_page' => -1,
			'post_status'    => 'publish',
			'orderby'        => 'date',
			'order'          => 'ASC',
		) );

		return rest_ensure_response( array_map( array( $this, 'prepare_todo' ), $posts ) );
	}

	public function get_todo( $request ) {
		$post = get_post( $request['id'] );
		if ( ! $post || $post->post_type !== Todo_CPT::POST_TYPE ) {
			return new WP_Error( 'not_found', __( 'Todo not found.', 'todo-manager' ), array( 'status' => 404 ) );
		}
		return rest_ensure_response( $this->prepare_todo( $post ) );
	}

	public function create_todo( $request ) {
		$title = sanitize_text_field( $request->get_param( 'title' ) );

		$post_id = wp_insert_post( array(
			'post_type'   => Todo_CPT::POST_TYPE,
			'post_title'  => $title,
			'post_status' => 'publish',
		), true );

		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}

		update_post_meta( $post_id, '_todo_completed', false );

		return rest_ensure_response( $this->prepare_todo( get_post( $post_id ) ) );
	}

	public function update_todo( $request ) {
		$post = get_post( $request['id'] );
		if ( ! $post || $post->post_type !== Todo_CPT::POST_TYPE ) {
			return new WP_Error( 'not_found', __( 'Todo not found.', 'todo-manager' ), array( 'status' => 404 ) );
		}

		$data = array( 'ID' => $post->ID );

		if ( $request->has_param( 'title' ) ) {
			$data['post_title'] = sanitize_text_field( $request->get_param( 'title' ) );
		}

		wp_update_post( $data );

		if ( $request->has_param( 'completed' ) ) {
			update_post_meta( $post->ID, '_todo_completed', (bool) $request->get_param( 'completed' ) );
		}

		return rest_ensure_response( $this->prepare_todo( get_post( $post->ID ) ) );
	}

	public function delete_todo( $request ) {
		$post = get_post( $request['id'] );
		if ( ! $post || $post->post_type !== Todo_CPT::POST_TYPE ) {
			return new WP_Error( 'not_found', __( 'Todo not found.', 'todo-manager' ), array( 'status' => 404 ) );
		}

		wp_delete_post( $post->ID, true );
		return rest_ensure_response( array( 'deleted' => true, 'id' => $post->ID ) );
	}

	// ─── Helpers ──────────────────────────────────────────────────────────────

	public function check_permission() {
		// Allow logged-in users (nonce verified by WP REST) or admins
		return is_user_logged_in() || current_user_can( 'manage_options' );
	}

	private function prepare_todo( WP_Post $post ) {
		return array(
			'id'        => $post->ID,
			'title'     => $post->post_title,
			'completed' => (bool) get_post_meta( $post->ID, '_todo_completed', true ),
			'created'   => $post->post_date,
		);
	}

	private function get_create_args() {
		return array(
			'title' => array(
				'required'          => true,
				'sanitize_callback' => 'sanitize_text_field',
				'validate_callback' => function( $v ) { return ! empty( trim( $v ) ); },
			),
		);
	}

	private function get_update_args() {
		return array(
			'title' => array(
				'sanitize_callback' => 'sanitize_text_field',
			),
			'completed' => array(
				'validate_callback' => function( $value ) {
					return is_bool( $value );
				},
			),
		);
	}
}
