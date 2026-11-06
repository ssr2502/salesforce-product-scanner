import { LightningElement, track } from 'lwc';
import { getBarcodeScanner } from 'lightning/mobileCapabilities';

export default class ProductScanner extends LightningElement {
    @track scannedItems = [];
    @track isScanning = false;
    @track errorMessage = '';

    _scanner = null;
    _nextId = 0;

    connectedCallback() {
        this._scanner = getBarcodeScanner();
    }

    disconnectedCallback() {
        if (this.isScanning) {
            this._scanner?.dismiss();
        }
    }

    get scannerUnavailable() {
        return !this._scanner?.isAvailable();
    }

    get hasResults() {
        return this.scannedItems.length > 0;
    }

    get scanButtonLabel() {
        return this.isScanning ? 'Scanning…' : 'Scan Barcode';
    }

    async handleScanClick() {
        if (!this._scanner?.isAvailable()) {
            return;
        }

        this.errorMessage = '';
        this.isScanning = true;

        try {
            const results = await this._scanner.scan({
                barcodeTypes: [
                    this._scanner.barcodeTypes.QR,
                    this._scanner.barcodeTypes.EAN_13,
                    this._scanner.barcodeTypes.EAN_8,
                    this._scanner.barcodeTypes.UPC_A,
                    this._scanner.barcodeTypes.UPC_E,
                    this._scanner.barcodeTypes.CODE_128,
                    this._scanner.barcodeTypes.CODE_39,
                    this._scanner.barcodeTypes.DATA_MATRIX,
                ],
                instructionText: 'Aim the camera at a product barcode',
                successText: 'Product captured!',
                showSuccessCheckMark: true,
                vibrateOnSuccess: true,
                enableBulkScan: true,
                enableMultiScan: true,
                previewBarcodeData: true,
                scannerSize: 'LARGE',
                cameraFacing: 'BACK',
            });

            const newItems = results.map((barcode) => ({
                id: this._nextId++,
                value: barcode.value,
                type: barcode.type,
            }));
            this.scannedItems = [...this.scannedItems, ...newItems];
        } catch (error) {
            this._handleScanError(error);
        } finally {
            this.isScanning = false;
        }
    }

    _handleScanError(error) {
        const code = error?.code;
        switch (code) {
            case 'USER_DISMISSED':
                // Intentional cancel — no error shown
                break;
            case 'USER_DENIED_PERMISSION':
                this.errorMessage =
                    'Camera permission was denied. Tap "Scan Barcode" again to re-request access.';
                break;
            case 'USER_DISABLED_PERMISSION':
                this.errorMessage =
                    'Camera access is disabled. Go to your device Settings and enable the camera for the Salesforce app.';
                break;
            case 'INVALID_BARCODE_TYPE_REQUESTED':
                this.errorMessage =
                    'An unsupported barcode type was requested. Contact your administrator.';
                break;
            case 'SERVICE_NOT_ENABLED':
                this.errorMessage =
                    'The barcode scanning service is not enabled in this org.';
                break;
            default:
                this.errorMessage =
                    'An unexpected error occurred while scanning. Please try again.';
        }
    }

    handleRemoveItem(event) {
        const id = Number(event.currentTarget.dataset.id);
        this.scannedItems = this.scannedItems.filter((item) => item.id !== id);
    }

    handleClearAll() {
        this.scannedItems = [];
        this.errorMessage = '';
    }
}
