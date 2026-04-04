<?php

Route::group([
    'prefix' => '/',
    'middleware' => ['api.key'],
], function () {
    Route::get('/', fn () => response()->json(['message' => 'request success, your key works!']));

    Route::group(['prefix' => 'mods', 'middleware' => ['api.scope:read:mods']], function () {
        Route::get('/', [\App\Http\Controllers\Api\Client\ModController::class, 'index'])->middleware('api.scope:read:mods:index');
        Route::get('/{mod}', [\App\Http\Controllers\Api\Client\ModController::class, 'show'])->middleware('api.scope:read:mods:show');
        Route::get('/{mod}/pages/search', [\App\Http\Controllers\Api\Client\ModController::class, 'search'])->middleware('api.scope:read:mods:search');
        Route::get('/{mod}/{page}', [\App\Http\Controllers\Api\Client\ModController::class, 'getPageContent'])->middleware('api.scope:read:mods:getPageContent');
    });
});

/*
 * Example of scope protection for API routes:
   Route::middleware('api.scope:read:mods')->group(function () {
        Route::get('/mods',        [\App\Http\Controllers\ModController::class, 'index']);
    });
*/
