<?php

//https://github.com/Athlon1600/php-proxy-app
//https://www.php-proxy.com/download/php-proxy.zip

set_time_limit( - 1 );



define( 'PROXY_START', microtime( true ) );

require( "vendor/autoload.php" );

use Proxy\Http\Request;
use Proxy\Http\Response;
use Proxy\Plugin\AbstractPlugin;
use Proxy\Event\FilterEvent;
use Proxy\Config;
use Proxy\Proxy;

session_start();

Config::load( 'config.php' );

if ( ! Config::get( 'app_key' ) ) {
	die( "app_key inside config.php cannot be empty!" );
}

if ( ! function_exists( 'curl_version' ) ) {
	die( "cURL extension is not loaded!" );
}

if ( Config::get( 'url_mode' ) == 2 ) {
	Config::set( 'encryption_key', md5( Config::get( 'app_key' ) . $_SERVER['REMOTE_ADDR'] ) );
} else if ( Config::get( 'url_mode' ) == 3 ) {
	Config::set( 'encryption_key', md5( Config::get( 'app_key' ) . session_id() ) );
}


session_write_close();

$uri = parse_url( @$_SERVER['REQUEST_URI'] );
$url = str_replace( "q=", "", @$uri['query'] );

$url   = url_decrypt( $url );

$proxy = new Proxy();

foreach ( Config::get( 'plugins', array() ) as $plugin ) {
	$plugin_class = $plugin . 'Plugin';
	$plugin_class = '\\Proxy\\Plugin\\' . $plugin_class;

	$proxy->getEventDispatcher()->addSubscriber( new $plugin_class() );
}


try {
	$request = Request::createFromGlobals();
	$request->get->clear();
	$response = $proxy->forward( $request, $url );
	$response->send();
} catch ( Exception $ex ) {
		header( "HTTP/1.1 302 Found" );
		header( "Location: {$url}" );
}
