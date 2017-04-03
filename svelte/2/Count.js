var Count = (function () { 'use strict';

function renderMainFragment ( root, component ) {
	var input = createElement( 'input' );
	
	var input_updating = false;
	
	function inputChangeHandler () {
		input_updating = true;
		component._set({ count: input.value });
		input_updating = false;
	}
	
	addEventListener( input, 'input', inputChangeHandler );
	
	input.__svelte = {
		root: root
	};
	
	input.value = root.count;
	
	var text = createText( "\n" );
	var ifBlock_anchor = createComment();
	
	function getBlock ( root ) {
		if ( root.count ) return renderIfBlock_0;
		return null;
	}
	
	var currentBlock = getBlock( root );
	var ifBlock = currentBlock && currentBlock( root, component );

	return {
		mount: function ( target, anchor ) {
			insertNode( input, target, anchor );
			insertNode( text, target, anchor );
			insertNode( ifBlock_anchor, target, anchor );
			if ( ifBlock ) ifBlock.mount( ifBlock_anchor.parentNode, ifBlock_anchor );
		},
		
		update: function ( changed, root ) {
			var __tmp;
		
			if ( !input_updating ) {
				input.value = root.count;
			}
			
			input.__svelte.root = root;
			
			var _currentBlock = currentBlock;
			currentBlock = getBlock( root );
			if ( _currentBlock === currentBlock && ifBlock) {
				ifBlock.update( changed, root );
			} else {
				if ( ifBlock ) ifBlock.teardown( true );
				ifBlock = currentBlock && currentBlock( root, component );
				if ( ifBlock ) ifBlock.mount( ifBlock_anchor.parentNode, ifBlock_anchor );
			}
		},
		
		teardown: function ( detach ) {
			removeEventListener( input, 'input', inputChangeHandler );
			if ( ifBlock ) ifBlock.teardown( detach );
			
			if ( detach ) {
				detachNode( input );
				detachNode( text );
				detachNode( ifBlock_anchor );
			}
		}
	};
}

function renderIfBlock_0 ( root, component ) {
	var button = createElement( 'button' );
	
	function clickHandler ( event ) {
		var root = this.__svelte.root;
		
		component.set({ count: ( 'parseInt' in root ? root.parseInt : parseInt )(root.count, 10) + 1 });
	}
	
	addEventListener( button, 'click', clickHandler );
	
	button.__svelte = {
		root: root
	};
	
	appendNode( createText( "+1" ), button );
	var text$1 = createText( "\n" );
	
	var p = createElement( 'p' );
	
	appendNode( createText( "Count: " ), p );
	var last_text$3 = root.count;
	var text$3 = createText( last_text$3 );
	appendNode( text$3, p );

	return {
		mount: function ( target, anchor ) {
			insertNode( button, target, anchor );
			insertNode( text$1, target, anchor );
			insertNode( p, target, anchor );
		},
		
		update: function ( changed, root ) {
			var __tmp;
		
			button.__svelte.root = root;
			
			if ( ( __tmp = root.count ) !== last_text$3 ) {
				text$3.data = last_text$3 = __tmp;
			}
		},
		
		teardown: function ( detach ) {
			removeEventListener( button, 'click', clickHandler );
			
			if ( detach ) {
				detachNode( button );
				detachNode( text$1 );
				detachNode( p );
			}
		}
	};
}

function Count ( options ) {
	options = options || {};
	this._state = options.data || {};
	
	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};
	
	this._handlers = Object.create( null );
	
	this._root = options._root;
	this._yield = options._yield;
	
	this._torndown = false;
	
	this._fragment = renderMainFragment( this._state, this );
	if ( options.target ) this._fragment.mount( options.target, null );
}

Count.prototype.get = get;
Count.prototype.fire = fire;
Count.prototype.observe = observe;
Count.prototype.on = on;
Count.prototype.set = set;
Count.prototype._flush = _flush;

Count.prototype._set = function _set ( newState ) {
	var oldState = this._state;
	this._state = Object.assign( {}, oldState, newState );
	
	dispatchObservers( this, this._observers.pre, newState, oldState );
	if ( this._fragment ) this._fragment.update( newState, this._state );
	dispatchObservers( this, this._observers.post, newState, oldState );
};

Count.prototype.teardown = Count.prototype.destroy = function destroy ( detach ) {
	this.fire( 'destroy' );

	this._fragment.teardown( detach !== false );
	this._fragment = null;

	this._state = {};
	this._torndown = true;
};

function addEventListener( node, event, handler ) {
	node.addEventListener ( event, handler, false );
}

function removeEventListener( node, event, handler ) {
	node.removeEventListener ( event, handler, false );
}

function createElement( name ) {
	return document.createElement( name );
}

function detachNode( node ) {
	node.parentNode.removeChild( node );
}

function insertNode( node, target, anchor ) {
	target.insertBefore( node, anchor );
}

function createText( data ) {
	return document.createTextNode( data );
}

function appendNode( node, target ) {
	target.appendChild( node );
}

function createComment() {
	return document.createComment( '' );
}

function dispatchObservers( component, group, newState, oldState ) {
	for ( var key in group ) {
		if ( !( key in newState ) ) continue;

		var newValue = newState[ key ];
		var oldValue = oldState[ key ];

		if ( newValue === oldValue && typeof newValue !== 'object' ) continue;

		var callbacks = group[ key ];
		if ( !callbacks ) continue;

		for ( var i = 0; i < callbacks.length; i += 1 ) {
			var callback = callbacks[i];
			if ( callback.__calling ) continue;

			callback.__calling = true;
			callback.call( component, newValue, oldValue );
			callback.__calling = false;
		}
	}
}

function get( key ) {
	return key ? this._state[ key ] : this._state;
}

function fire( eventName, data ) {
	var handlers = eventName in this._handlers && this._handlers[ eventName ].slice();
	if ( !handlers ) return;

	for ( var i = 0; i < handlers.length; i += 1 ) {
		handlers[i].call( this, data );
	}
}

function observe( key, callback, options ) {
	var group = ( options && options.defer ) ? this._observers.pre : this._observers.post;

	( group[ key ] || ( group[ key ] = [] ) ).push( callback );

	if ( !options || options.init !== false ) {
		callback.__calling = true;
		callback.call( this, this._state[ key ] );
		callback.__calling = false;
	}

	return {
		cancel: function () {
			var index = group[ key ].indexOf( callback );
			if ( ~index ) group[ key ].splice( index, 1 );
		}
	};
}

function on( eventName, handler ) {
	if ( eventName === 'teardown' ) return this.on( 'destroy', handler );

	var handlers = this._handlers[ eventName ] || ( this._handlers[ eventName ] = [] );
	handlers.push( handler );

	return {
		cancel: function () {
			var index = handlers.indexOf( handler );
			if ( ~index ) handlers.splice( index, 1 );
		}
	};
}

function set( newState ) {
	this._set( newState );
	( this._root || this )._flush();
}

function _flush() {
	if ( !this._renderHooks ) return;

	while ( this._renderHooks.length ) {
		var hook = this._renderHooks.pop();
		hook.fn.call( hook.context );
	}
}

return Count;

}());