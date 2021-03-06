
Booker.Actions.Topology = Reflux.createAction();

Booker.State.Topology = Reflux.createStore({
  init: function() {
    this.listenTo( Booker.Actions.Topology, this.output );
    this.sse = new EventSource( "/system/ribbon/stream" );
    this.sse.onmessage = Booker.Actions.Topology;
    this.topology = {};
  },

  output: function(topology) {
    this.topology = JSON.parse( topology.data );
    this.trigger(this.topology);
  },

  services: function() {
    return Object.getOwnPropertyNames( this.topology ).sort( function(l,r) {
      return l.localeCompare(r);
    });
  },

  servers: function(serviceName) {
    return this.topology[serviceName] || [];
  }

});

Booker.Topology = React.createClass({
  mixins: [Reflux.connect(Booker.State.Topology,"topology")],

  render: function() {
    var services = Booker.State.Topology.services();
    return (
      <div>
        <h1>Topology</h1>
        {
          services.map( function(e) {
            return (
              <Booker.TopologyService name={e} key={e} servers={Booker.State.Topology.servers(e)}/>
            )
          })
        }
      </div>
    );
  }
});

Booker.TopologyService = React.createClass({
  render: function() {
    return (
      <div>
        <h3>{this.props.name}</h3>
        <ul>
        {
          this.props.servers.map(function(e){
            return (
              <li key={e}><a href={"//" + e}>{e}</a></li>
            )
          })
        }
        </ul>
      </div>

    )
  }
});


Ribbon = {};

Ribbon.ajax = function(serviceName, url, settings) {
  var allServers = Booker.State.Topology.servers( serviceName );

  if ( ! settings ) {
    settings = {};
  }

  var headers = settings.headers || {};

  if ( keycloak.token ) {
    headers.Authorization = 'Bearer ' + keycloak.token
  }

  settings.url = '//' + allServers[0] + url;
  settings.headers = headers;

  if ( allServers.length > 0 ) {
    return $.ajax( settings );
  }

  var deferred = $.Deferred();
  return deferred.reject();
}

Ribbon.getJSON = function(serviceName, url, data) {
  return Ribbon.ajax( serviceName, url, {
    dataType: 'json',
    data: data,
  })
}

Ribbon.postJSON = function(serviceName, url, data) {
  return Ribbon.ajax( serviceName, url, {
    dataType: 'json',
    method: 'POST',
    data: data,
  })
}
