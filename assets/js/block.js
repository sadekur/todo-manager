( function ( blocks, element, blockEditor, apiFetch, i18n ) {
	'use strict';

	var el       = element.createElement;
	var __ = i18n.__;
	var useSelect = wp.data.useSelect;
	var useState  = element.useState;
	var useEffect = element.useEffect;
	var Fragment  = element.Fragment;

	blocks.registerBlockType( 'todo-manager/todo-list', {
		title:       __( 'Todo List', 'todo-manager' ),
		description: __( 'An interactive, persistent todo list.', 'todo-manager' ),
		icon:        'checklist',
		category:    'widgets',
		keywords:    [ __( 'todo' ), __( 'task' ), __( 'list' ) ],
		supports: {
			html:           false,
			multiple:       false,
			reusable:       false,
			anchor:         false,
		},
		attributes: {},

		edit: function EditTodoBlock() {
			var _useState  = useState( [] );
			var todos      = _useState[0];
			var setTodos   = _useState[1];

			var _useStateLoading = useState( true );
			var loading          = _useStateLoading[0];
			var setLoading       = _useStateLoading[1];

			var _useStateTitle = useState( '' );
			var newTitle       = _useStateTitle[0];
			var setNewTitle    = _useStateTitle[1];

			useEffect( function () {
				apiFetch( { path: '/todo-manager/v1/todos' } )
					.then( function ( data ) {
						setTodos( data );
						setLoading( false );
					} )
					.catch( function () { setLoading( false ); } );
			}, [] );

			function handleAdd() {
				var title = newTitle.trim();
				if ( ! title ) return;
				setNewTitle( '' );
				apiFetch( {
					path:   '/todo-manager/v1/todos',
					method: 'POST',
					data:   { title: title },
				} ).then( function ( todo ) {
					setTodos( function ( prev ) { return prev.concat( todo ); } );
				} );
			}

			function handleToggle( id, completed ) {
				apiFetch( {
					path:   '/todo-manager/v1/todos/' + id,
					method: 'PUT',
					data:   { completed: ! completed },
				} ).then( function ( updated ) {
					setTodos( function ( prev ) {
						return prev.map( function ( t ) { return t.id === id ? updated : t; } );
					} );
				} );
			}

			function handleDelete( id ) {
				apiFetch( {
					path:   '/todo-manager/v1/todos/' + id,
					method: 'DELETE',
				} ).then( function () {
					setTodos( function ( prev ) {
						return prev.filter( function ( t ) { return t.id !== id; } );
					} );
				} );
			}

			return el( Fragment, null,
				el( blockEditor.BlockControls, null ),
				el( 'div', { className: 'todo-manager-block todo-manager-editor' },
					el( 'h3', { className: 'todo-manager-heading' },
						__( 'Todo List', 'todo-manager' )
					),
					el( 'div', { className: 'todo-add-row' },
						el( 'input', {
							type:        'text',
							className:   'todo-input',
							placeholder: __( 'Add a new todo...', 'todo-manager' ),
							value:       newTitle,
							onChange:    function ( e ) { setNewTitle( e.target.value ); },
							onKeyDown:   function ( e ) { if ( e.key === 'Enter' ) handleAdd(); },
						} ),
						el( 'button', {
							className: 'todo-add-btn button button-primary',
							onClick:   handleAdd,
						}, __( 'Add', 'todo-manager' ) )
					),
					loading
						? el( 'p', { className: 'todo-loading' }, __( 'Loading…', 'todo-manager' ) )
						: el( 'ul', { className: 'todo-list' },
							todos.length === 0
								? el( 'li', { className: 'todo-empty' },
									__( 'No todos yet. Add one above!', 'todo-manager' )
								  )
								: todos.map( function ( todo ) {
									return el( 'li', {
										key:       todo.id,
										className: 'todo-item' + ( todo.completed ? ' todo-completed' : '' ),
									},
										el( 'input', {
											type:     'checkbox',
											checked:  todo.completed,
											onChange: function () { handleToggle( todo.id, todo.completed ); },
											className: 'todo-checkbox',
											id:       'todo-editor-' + todo.id,
										} ),
										el( 'label', {
											htmlFor:   'todo-editor-' + todo.id,
											className: 'todo-label',
										}, todo.title ),
										el( 'button', {
											className: 'todo-delete-btn',
											onClick:   function () { handleDelete( todo.id ); },
											title:     __( 'Delete', 'todo-manager' ),
										}, '×' )
									);
								} )
						  )
				)
			);
		},

		save: function () {
			// Dynamic block — render_callback handles output
			return null;
		},
	} );

} (
	window.wp.blocks,
	window.wp.element,
	window.wp.blockEditor,
	window.wp.apiFetch,
	window.wp.i18n
) );
