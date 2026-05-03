( function () {
	'use strict';

	var apiUrl = todoManagerData.apiUrl;
	var nonce  = todoManagerData.nonce;

	// ─── State ──────────────────────────────────────────────────────────────
	var state = { todos: [], loading: true };

	// ─── API ────────────────────────────────────────────────────────────────
	function request( method, url, body ) {
		var opts = {
			method:  method,
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce':   nonce,
			},
		};
		if ( body ) opts.body = JSON.stringify( body );
		return fetch( url, opts ).then( function ( r ) { return r.json(); } );
	}

	var api = {
		list:   function ()     { return request( 'GET',    apiUrl );          },
		create: function ( t )  { return request( 'POST',   apiUrl, { title: t } ); },
		update: function ( id, data ) { return request( 'PUT', apiUrl + '/' + id, data ); },
		remove: function ( id ) { return request( 'DELETE', apiUrl + '/' + id );     },
	};

	// ─── DOM helpers ────────────────────────────────────────────────────────
	var app;

	function render() {
		if ( ! app ) return;

		var html = '';

		html += '<div class="todo-manager-inner">';
		html += '<h2 class="todo-manager-title">My Todos</h2>';

		// Add form
		html += '<div class="todo-add-row">';
		html += '<input type="text" id="tm-new-title" class="tm-input" placeholder="Add a new todo…" maxlength="200" />';
		html += '<button id="tm-add-btn" class="tm-btn tm-btn-primary">Add</button>';
		html += '</div>';

		// List
		html += '<ul class="tm-list">';

		if ( state.loading ) {
			html += '<li class="tm-loading">Loading…</li>';
		} else if ( state.todos.length === 0 ) {
			html += '<li class="tm-empty">No todos yet. Add one above!</li>';
		} else {
			state.todos.forEach( function ( todo ) {
				var cls = 'tm-item' + ( todo.completed ? ' tm-completed' : '' );
				html += '<li class="' + cls + '" data-id="' + todo.id + '">';
				html += '<input type="checkbox" class="tm-check" id="tm-' + todo.id + '"' + ( todo.completed ? ' checked' : '' ) + ' />';
				html += '<label for="tm-' + todo.id + '" class="tm-label">' + escHtml( todo.title ) + '</label>';
				html += '<button class="tm-delete" title="Delete todo" data-id="' + todo.id + '">&#x2715;</button>';
				html += '</li>';
			} );
		}

		html += '</ul>';

		// Stats
		if ( ! state.loading && state.todos.length > 0 ) {
			var done  = state.todos.filter( function ( t ) { return t.completed; } ).length;
			var total = state.todos.length;
			html += '<p class="tm-stats">' + done + ' / ' + total + ' completed</p>';
		}

		html += '</div>';

		app.innerHTML = html;
		bindEvents();
	}

	function bindEvents() {
		var addBtn = document.getElementById( 'tm-add-btn' );
		var input  = document.getElementById( 'tm-new-title' );

		if ( addBtn ) {
			addBtn.addEventListener( 'click', handleAdd );
		}
		if ( input ) {
			input.addEventListener( 'keydown', function ( e ) {
				if ( e.key === 'Enter' ) handleAdd();
			} );
		}

		app.querySelectorAll( '.tm-check' ).forEach( function ( chk ) {
			chk.addEventListener( 'change', function () {
				var id        = parseInt( chk.closest( '.tm-item' ).dataset.id, 10 );
				var completed = chk.checked;
				api.update( id, { completed: completed } ).then( function ( updated ) {
					state.todos = state.todos.map( function ( t ) {
						return t.id === id ? updated : t;
					} );
					render();
				} );
			} );
		} );

		app.querySelectorAll( '.tm-delete' ).forEach( function ( btn ) {
			btn.addEventListener( 'click', function () {
				var id = parseInt( btn.dataset.id, 10 );
				api.remove( id ).then( function () {
					state.todos = state.todos.filter( function ( t ) { return t.id !== id; } );
					render();
				} );
			} );
		} );
	}

	function handleAdd() {
		var input = document.getElementById( 'tm-new-title' );
		if ( ! input ) return;
		var title = input.value.trim();
		if ( ! title ) return;
		input.value = '';
		input.disabled = true;
		api.create( title ).then( function ( todo ) {
			state.todos = state.todos.concat( todo );
			render();
		} ).catch( function () {
			input.disabled = false;
			render();
		} );
	}

	function escHtml( str ) {
		return String( str )
			.replace( /&/g, '&amp;' )
			.replace( /</g, '&lt;' )
			.replace( />/g, '&gt;' )
			.replace( /"/g, '&quot;' )
			.replace( /'/g, '&#039;' );
	}

	// ─── Boot ───────────────────────────────────────────────────────────────
	function init() {
		app = document.getElementById( 'todo-manager-app' );
		if ( ! app ) return;

		render(); // Show loading state

		api.list().then( function ( todos ) {
			state.todos   = todos;
			state.loading = false;
			render();
		} ).catch( function () {
			state.loading = false;
			render();
		} );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}

} () );
