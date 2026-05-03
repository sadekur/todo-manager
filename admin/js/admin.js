/* global wp, todoManagerAdmin, jQuery */
( function ( apiFetch, $ ) {
	'use strict';

	var cfg = todoManagerAdmin;

	// Configure apiFetch with nonce
	apiFetch.use( apiFetch.createNonceMiddleware( cfg.nonce ) );

	// ─── State ──────────────────────────────────────────────────────────────
	var todos = [];

	// ─── DOM refs ───────────────────────────────────────────────────────────
	var $tbody    = $( '#todo-admin-tbody' );
	var $table    = $( '#todo-admin-table' );
	var $loading  = $( '#todo-admin-loading' );
	var $empty    = $( '#todo-admin-empty' );
	var $addBtn   = $( '#todo-add-btn' );
	var $addInput = $( '#todo-new-title' );
	var $addError = $( '#todo-add-error p' );
	var $modal    = $( '#todo-edit-modal' );

	// ─── Render ─────────────────────────────────────────────────────────────
	function renderList() {
		$loading.addClass( 'hidden' );
		$tbody.empty();

		if ( todos.length === 0 ) {
			$table.addClass( 'hidden' );
			$empty.removeClass( 'hidden' );
			return;
		}

		$empty.addClass( 'hidden' );
		$table.removeClass( 'hidden' );

		todos.forEach( function ( todo ) {
			var $row = $( '<tr/>', { 'data-id': todo.id } );
			var statusClass = todo.completed ? 'todo-status-done' : 'todo-status-pending';
			var statusLabel = todo.completed ? 'Completed' : 'Pending';
			var titleClass  = todo.completed ? 'todo-title-done' : '';

			$row.html(
				'<td class="column-status"><span class="todo-badge ' + statusClass + '">' + statusLabel + '</span></td>' +
				'<td class="column-title"><span class="' + titleClass + '">' + escHtml( todo.title ) + '</span></td>' +
				'<td class="column-created">' + formatDate( todo.created ) + '</td>' +
				'<td class="column-actions">' +
					'<button class="button button-small todo-toggle-btn" data-id="' + todo.id + '" data-completed="' + todo.completed + '">' +
						( todo.completed ? 'Mark Pending' : 'Mark Done' ) +
					'</button> ' +
					'<button class="button button-small todo-edit-btn" data-id="' + todo.id + '">Edit</button> ' +
					'<button class="button button-small button-link-delete todo-delete-btn" data-id="' + todo.id + '">Delete</button>' +
				'</td>'
			);
			$tbody.append( $row );
		} );
	}

	// ─── API ────────────────────────────────────────────────────────────────
	function loadTodos() {
		$loading.removeClass( 'hidden' );
		apiFetch( { url: cfg.apiUrl } )
			.then( function ( data ) {
				todos = data;
				renderList();
			} )
			.catch( function () {
				$loading.text( 'Failed to load todos.' );
			} );
	}

	function createTodo( title ) {
		setAddLoading( true );
		apiFetch( { url: cfg.apiUrl, method: 'POST', data: { title: title } } )
			.then( function ( todo ) {
				todos.push( todo );
				$addInput.val( '' );
				renderList();
				showAddError( '' );
			} )
			.catch( function ( err ) {
				showAddError( err.message || cfg.i18n.error );
			} )
			.finally( function () { setAddLoading( false ); } );
	}

	function updateTodo( id, data, $row ) {
		apiFetch( { url: cfg.apiUrl + '/' + id, method: 'PUT', data: data } )
			.then( function ( updated ) {
				todos = todos.map( function ( t ) { return t.id === id ? updated : t; } );
				renderList();
			} )
			.catch( function () { alert( cfg.i18n.error ); } );
	}

	function deleteTodo( id ) {
		if ( ! confirm( cfg.i18n.confirmDelete ) ) return;
		apiFetch( { url: cfg.apiUrl + '/' + id, method: 'DELETE' } )
			.then( function () {
				todos = todos.filter( function ( t ) { return t.id !== id; } );
				renderList();
			} )
			.catch( function () { alert( cfg.i18n.error ); } );
	}

	// ─── Modal ──────────────────────────────────────────────────────────────
	function openEditModal( id ) {
		var todo = todos.find( function ( t ) { return t.id === id; } );
		if ( ! todo ) return;
		$( '#todo-edit-id' ).val( todo.id );
		$( '#todo-edit-title' ).val( todo.title );
		$( '#todo-edit-completed' ).prop( 'checked', todo.completed );
		$( '#todo-edit-error' ).addClass( 'hidden' );
		$modal.removeClass( 'hidden' );
		$( '#todo-edit-title' ).focus();
	}

	function closeEditModal() {
		$modal.addClass( 'hidden' );
	}

	function saveEditModal() {
		var id        = parseInt( $( '#todo-edit-id' ).val(), 10 );
		var title     = $( '#todo-edit-title' ).val().trim();
		var completed = $( '#todo-edit-completed' ).is( ':checked' );

		if ( ! title ) {
			$( '#todo-edit-error p' ).text( 'Title cannot be empty.' );
			$( '#todo-edit-error' ).removeClass( 'hidden' );
			return;
		}

		var $saveBtn = $( '#todo-edit-save' );
		$saveBtn.prop( 'disabled', true ).text( cfg.i18n.saving );

		apiFetch( {
			url:    cfg.apiUrl + '/' + id,
			method: 'PUT',
			data:   { title: title, completed: completed },
		} )
			.then( function ( updated ) {
				todos = todos.map( function ( t ) { return t.id === id ? updated : t; } );
				closeEditModal();
				renderList();
			} )
			.catch( function ( err ) {
				$( '#todo-edit-error p' ).text( err.message || cfg.i18n.error );
				$( '#todo-edit-error' ).removeClass( 'hidden' );
			} )
			.finally( function () {
				$saveBtn.prop( 'disabled', false ).text( 'Save Changes' );
			} );
	}

	// ─── UI helpers ─────────────────────────────────────────────────────────
	function setAddLoading( on ) {
		$addBtn.prop( 'disabled', on ).text( on ? cfg.i18n.saving : 'Add Todo' );
		$addInput.prop( 'disabled', on );
	}

	function showAddError( msg ) {
		if ( msg ) {
			$addError.text( msg );
			$addError.closest( '.notice' ).removeClass( 'hidden' );
		} else {
			$addError.closest( '.notice' ).addClass( 'hidden' );
		}
	}

	function escHtml( str ) {
		return $( '<div/>' ).text( str ).html();
	}

	function formatDate( dateStr ) {
		if ( ! dateStr ) return '—';
		var d = new Date( dateStr );
		return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
	}

	// ─── Event delegation ────────────────────────────────────────────────────
	$( document ).on( 'click', '#todo-add-btn', function () {
		var title = $addInput.val().trim();
		if ( ! title ) { showAddError( 'Please enter a title.' ); return; }
		createTodo( title );
	} );

	$addInput.on( 'keydown', function ( e ) {
		if ( e.key === 'Enter' ) $addBtn.trigger( 'click' );
	} );

	$( document ).on( 'click', '.todo-toggle-btn', function () {
		var id        = parseInt( $( this ).data( 'id' ), 10 );
		var completed = $( this ).data( 'completed' ) === true || $( this ).data( 'completed' ) === 'true';
		updateTodo( id, { completed: ! completed } );
	} );

	$( document ).on( 'click', '.todo-edit-btn', function () {
		openEditModal( parseInt( $( this ).data( 'id' ), 10 ) );
	} );

	$( document ).on( 'click', '.todo-delete-btn', function () {
		deleteTodo( parseInt( $( this ).data( 'id' ), 10 ) );
	} );

	$( '#todo-edit-save' ).on( 'click', saveEditModal );
	$( '#todo-edit-cancel, .todo-modal-overlay' ).on( 'click', closeEditModal );

	$( document ).on( 'keydown', function ( e ) {
		if ( e.key === 'Escape' ) closeEditModal();
	} );

	// ─── Boot ───────────────────────────────────────────────────────────────
	$( function () { loadTodos(); } );

} ( wp.apiFetch, jQuery ) );
