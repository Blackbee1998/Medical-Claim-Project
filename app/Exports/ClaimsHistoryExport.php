<?php

namespace App\Exports;

use App\Models\BenefitClaims;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithProperties;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class ClaimsHistoryExport implements FromCollection, WithHeadings, WithMapping, WithStyles, WithColumnWidths, WithTitle, ShouldAutoSize, WithProperties
{
    protected $query;
    protected $filterInfo;

    public function __construct($query, $filterInfo = [])
    {
        $this->query = $query;
        $this->filterInfo = $filterInfo;
    }

    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        return $this->query->get();
    }

    /**
     * @return array
     */
    public function headings(): array
    {
        return [
            'Claim Date',
            'Employee Name',
            'Employee NIK',
            'Department',
            'Benefit Type',
            'Claim Amount (IDR)',
            'Description',
            'Status',
            'Created At'
        ];
    }

    /**
     * @param mixed $claim
     * @return array
     */
    public function map($claim): array
    {
        return [
            $claim->claim_date ? $claim->claim_date->format('Y-m-d') : '',
            $claim->employee->name ?? '',
            $claim->employee->nik ?? '',
            $claim->employee->department ?? '',
            $claim->benefitType->name ?? '',
            $claim->amount,
            $claim->description ?? '',
            ucfirst($claim->status ?? ''),
            $claim->created_at ? $claim->created_at->format('Y-m-d H:i:s') : ''
        ];
    }

    /**
     * @param Worksheet $sheet
     * @return array
     */
    public function styles(Worksheet $sheet)
    {
        $highestRow = $sheet->getHighestRow();
        $highestColumn = $sheet->getHighestColumn();

        // Header styling
        $sheet->getStyle('A1:' . $highestColumn . '1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 12
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '4472C4']
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => '000000']
                ]
            ]
        ]);

        // Data rows styling
        if ($highestRow > 1) {
            $sheet->getStyle('A2:' . $highestColumn . $highestRow)->applyFromArray([
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => 'CCCCCC']
                    ]
                ],
                'alignment' => [
                    'vertical' => Alignment::VERTICAL_CENTER
                ]
            ]);

            // Alternate row colors
            for ($row = 2; $row <= $highestRow; $row++) {
                if ($row % 2 == 0) {
                    $sheet->getStyle('A' . $row . ':' . $highestColumn . $row)->applyFromArray([
                        'fill' => [
                            'fillType' => Fill::FILL_SOLID,
                            'startColor' => ['rgb' => 'F8F9FA']
                        ]
                    ]);
                }
            }
        }

        // Amount column formatting
        $sheet->getStyle('F2:F' . $highestRow)->getNumberFormat()->setFormatCode('#,##0');
        
        // Center alignment for specific columns
        $sheet->getStyle('A2:A' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER); // Date
        $sheet->getStyle('C2:C' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER); // NIK
        $sheet->getStyle('F2:F' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);  // Amount
        $sheet->getStyle('H2:H' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER); // Status
        $sheet->getStyle('I2:I' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER); // Created At

        // Status column conditional formatting
        for ($row = 2; $row <= $highestRow; $row++) {
            $statusCell = $sheet->getCell('H' . $row);
            $status = strtolower($statusCell->getValue());
            
            switch ($status) {
                case 'approved':
                    $statusCell->getStyle()->applyFromArray([
                        'font' => ['color' => ['rgb' => '198754'], 'bold' => true],
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'D1E7DD']]
                    ]);
                    break;
                case 'pending':
                    $statusCell->getStyle()->applyFromArray([
                        'font' => ['color' => ['rgb' => 'FFC107'], 'bold' => true],
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'FFF3CD']]
                    ]);
                    break;
                case 'rejected':
                    $statusCell->getStyle()->applyFromArray([
                        'font' => ['color' => ['rgb' => 'DC3545'], 'bold' => true],
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F8D7DA']]
                    ]);
                    break;
            }
        }

        return [];
    }

    /**
     * @return array
     */
    public function columnWidths(): array
    {
        return [
            'A' => 12,  // Claim Date
            'B' => 20,  // Employee Name
            'C' => 15,  // Employee NIK
            'D' => 15,  // Department
            'E' => 15,  // Benefit Type
            'F' => 18,  // Claim Amount
            'G' => 25,  // Description
            'H' => 12,  // Status
            'I' => 20,  // Created At
        ];
    }

    /**
     * @return string
     */
    public function title(): string
    {
        $filterString = empty($this->filterInfo) ? 'All Data' : implode(' - ', $this->filterInfo);
        return 'Claims History - ' . $filterString;
    }

    /**
     * @return array
     */
    public function properties(): array
    {
        return [
            'creator'        => 'Claims Management System',
            'lastModifiedBy' => 'Claims Management System',
            'title'          => 'Claims History Export',
            'description'    => 'Export of benefit claims history with applied filters',
            'subject'        => 'Benefit Claims Report',
            'keywords'       => 'claims,benefits,export,xlsx',
            'category'       => 'Reports',
            'manager'        => 'System Administrator',
            'company'        => 'Your Company Name',
        ];
    }
} 