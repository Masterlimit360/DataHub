<?php
/**
 * Africa's Talking USSD Handler - Data Bundle Purchase
 * Code: *384*6014#
 * ------------------------------------------------------
 * Africa's Talking sends the FULL accumulated input each time, e.g.:
 *   User dials              -> text = ""
 *   User sends "1"          -> text = "1"
 *   User sends "2"          -> text = "1*2"
 *   User sends "0244000000" -> text = "1*2*0244000000"
 *
 * So we split on '*' and use the array to figure out which step we're on.
 * No database needed just to track menu position (though you still need
 * one for wallet balances / order logs).
 */

header('Content-type: text/plain');

// ---- Read POST variables from Africa's Talking ----
$sessionId   = $_POST['sessionId'] ?? '';
$networkCode = $_POST['networkCode'] ?? '';
$serviceCode = $_POST['serviceCode'] ?? '';
$phoneNumber = ltrim($_POST['phoneNumber'] ?? '', '+');
$text        = $_POST['text'] ?? '';

$response = "";

// ---- Bundle catalog (swap for a live wholesale API call if prices change often) ----
$networks = [
    '1' => 'MTN',
    '2' => 'Telecel',
    '3' => 'AirtelTigo',
];

$bundles = [
    '1' => ['label' => '1GB - GHS 5',  'price' => 5],
    '2' => ['label' => '2GB - GHS 9',  'price' => 9],
    '3' => ['label' => '5GB - GHS 20', 'price' => 20],
];

$textArray = explode('*', $text);

if ($text === '') {
    // ---- Step 0: welcome menu ----
    $response = "CON Welcome to [Your Brand] Data\n";
    $response .= "1. Buy Data Bundle\n";
    $response .= "2. Check Wallet Balance";

} elseif ($textArray[0] === '2' && count($textArray) === 1) {
    // ---- Balance check, ends session ----
    $balance = getWalletBalance($phoneNumber); // implement against your DB
    $response = "END Your wallet balance is GHS " . number_format($balance, 2);

} elseif ($textArray[0] === '1') {

    if (count($textArray) === 1) {
        // ---- Step 1: chose "Buy Data", show networks ----
        $response = "CON Select network:\n";
        foreach ($networks as $k => $v) {
            $response .= "$k. $v\n";
        }
        $response = rtrim($response);

    } elseif (count($textArray) === 2) {
        // ---- Step 2: chose network, show bundles ----
        $networkChoice = $textArray[1];

        if (!isset($networks[$networkChoice])) {
            $response = "END Invalid network selection.";
        } else {
            $response = "CON Select bundle:\n";
            foreach ($bundles as $k => $b) {
                $response .= "$k. {$b['label']}\n";
            }
            $response = rtrim($response);
        }

    } elseif (count($textArray) === 3) {
        // ---- Step 3: chose bundle, confirm ----
        $networkChoice = $textArray[1];
        $bundleChoice  = $textArray[2];

        if (!isset($networks[$networkChoice]) || !isset($bundles[$bundleChoice])) {
            $response = "END Invalid selection.";
        } else {
            $network = $networks[$networkChoice];
            $bundle  = $bundles[$bundleChoice];
            $response = "CON Confirm purchase:\n";
            $response .= "{$bundle['label']} ({$network})\n";
            $response .= "to $phoneNumber\n";
            $response .= "1. Confirm\n2. Cancel";
        }

    } elseif (count($textArray) === 4) {
        // ---- Step 4: confirm or cancel ----
        $networkChoice = $textArray[1];
        $bundleChoice  = $textArray[2];
        $confirmChoice = $textArray[3];

        $network = $networks[$networkChoice] ?? null;
        $bundle  = $bundles[$bundleChoice] ?? null;

        if (!$network || !$bundle) {
            $response = "END Invalid selection.";
        } elseif ($confirmChoice === '1') {
            $ok = purchaseBundle($phoneNumber, $network, $bundle); // calls your wholesale API
            if ($ok) {
                $response = "END Purchase successful! {$bundle['label']} is on its way. You'll get an SMS confirmation.";
            } else {
                $response = "END Purchase failed - insufficient balance or network error. Please top up and try again.";
            }
        } else {
            $response = "END Purchase cancelled.";
        }

    } else {
        $response = "END Invalid input.";
    }

} else {
    $response = "END Invalid option.";
}

echo $response;

// ---------------- helpers ----------------

function getWalletBalance($phoneNumber) {
    // TODO: look up your own users/wallet table by phoneNumber
    return 0.00;
}

function purchaseBundle($phoneNumber, $network, $bundle) {
    // TODO: call your wholesale bundle API here (cURL POST),
    // deduct from wallet, log the transaction, and optionally
    // send an SMS receipt via Africa's Talking's SMS API.
    return true;
}
