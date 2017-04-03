var Timer = (function () { 'use strict';

function applyComputations ( state, newState, oldState, isInitial ) {
	if ( isInitial || ( 'time' in newState && typeof state.time === 'object' || state.time !== oldState.time ) ) {
		state.hours = newState.hours = template.computed.hours( state.time );
	}
	
	if ( isInitial || ( 'time' in newState && typeof state.time === 'object' || state.time !== oldState.time ) ) {
		state.minutes = newState.minutes = template.computed.minutes( state.time );
	}
	
	if ( isInitial || ( 'time' in newState && typeof state.time === 'object' || state.time !== oldState.time ) ) {
		state.seconds = newState.seconds = template.computed.seconds( state.time );
	}
}

var template = (function () {
  return {
    oncreate () {
      this.interval = setInterval( () => { this.set({ time: new Date() }); }, 1000 );
    },
    ondestroy () {
      clearInterval( this.interval );
    },
    data () {
      return {
        time: new Date()
      };
    },
    computed: {
      hours: time => time.getHours(),
      minutes: time => time.getMinutes(),
      seconds: time => time.getSeconds(),
    },
  };
}());

var addedCss = false;
function addCss () {
	var style = createElement( 'style' );
	style.textContent = "\n[svelte-4010452902].timer, [svelte-4010452902] .timer{\n  color:red;\n}\n";
	appendNode( style, document.head );

	addedCss = true;
}

function renderMainFragment ( root, component ) {
	var p = createElement( 'p' );
	setAttribute( p, 'svelte-4010452902', '' );
	p.className = "timer";
	
	appendNode( createText( "The time is " ), p );
	
	var strong = createElement( 'strong' );
	setAttribute( strong, 'svelte-4010452902', '' );
	
	appendNode( strong, p );
	var last_text$1 = root.hours;
	var text$1 = createText( last_text$1 );
	appendNode( text$1, strong );
	appendNode( createText( ":" ), strong );
	var last_text$3 = root.minutes;
	var text$3 = createText( last_text$3 );
	appendNode( text$3, strong );
	appendNode( createText( ":" ), strong );
	var last_text$5 = root.seconds;
	var text$5 = createText( last_text$5 );
	appendNode( text$5, strong );

	return {
		mount: function ( target, anchor ) {
			insertNode( p, target, anchor );
		},
		
		update: function ( changed, root ) {
			var __tmp;
		
			if ( ( __tmp = root.hours ) !== last_text$1 ) {
				text$1.data = last_text$1 = __tmp;
			}
			
			if ( ( __tmp = root.minutes ) !== last_text$3 ) {
				text$3.data = last_text$3 = __tmp;
			}
			
			if ( ( __tmp = root.seconds ) !== last_text$5 ) {
				text$5.data = last_text$5 = __tmp;
			}
		},
		
		teardown: function ( detach ) {
			if ( detach ) {
				detachNode( p );
			}
		}
	};
}

function Timer ( options ) {
	options = options || {};
	this._state = Object.assign( template.data(), options.data );
	applyComputations( this._state, this._state, {}, true );
	
	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};
	
	this._handlers = Object.create( null );
	
	this._root = options._root;
	this._yield = options._yield;
	
	this._torndown = false;
	if ( !addedCss ) addCss();
	
	this._fragment = renderMainFragment( this._state, this );
	if ( options.target ) this._fragment.mount( options.target, null );
	
	if ( options._root ) {
		options._root._renderHooks.push({ fn: template.oncreate, context: this });
	} else {
		template.oncreate.call( this );
	}
}

Timer.prototype.get = get;
Timer.prototype.fire = fire;
Timer.prototype.observe = observe;
Timer.prototype.on = on;
Timer.prototype.set = set;
Timer.prototype._flush = _flush;

Timer.prototype._set = function _set ( newState ) {
	var oldState = this._state;
	this._state = Object.assign( {}, oldState, newState );
	applyComputations( this._state, newState, oldState, false )
	
	dispatchObservers( this, this._observers.pre, newState, oldState );
	if ( this._fragment ) this._fragment.update( newState, this._state );
	dispatchObservers( this, this._observers.post, newState, oldState );
};

Timer.prototype.teardown = Timer.prototype.destroy = function destroy ( detach ) {
	this.fire( 'destroy' );
template.ondestroy.call( this );

	this._fragment.teardown( detach !== false );
	this._fragment = null;

	this._state = {};
	this._torndown = true;
};

function createElement( name ) {
	return document.createElement( name );
}

function setAttribute( node, attribute, value ) {
	node.setAttribute ( attribute, value );
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

return Timer;

}());