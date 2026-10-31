package com.divyimpex.service;

import com.divyimpex.dto.InitialDataResponse;
import com.divyimpex.entity.Company;
import com.divyimpex.entity.Diamond;
import com.divyimpex.entity.History;
import com.divyimpex.entity.Worker;
import com.divyimpex.repository.CompanyRepository;
import com.divyimpex.repository.DiamondRepository;
import com.divyimpex.repository.HistoryRepository;
import com.divyimpex.repository.WorkerRepository;
import com.divyimpex.util.DateTimeUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class DiamondService {

    @Autowired
    private DiamondRepository diamondRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private WorkerRepository workerRepository;

    @Autowired
    private HistoryRepository historyRepository;

    public InitialDataResponse getInitialData() {
        return new InitialDataResponse(
                companyRepository.findAll(),
                workerRepository.findAll(),
                diamondRepository.findAll(),
                historyRepository.findAll()
        );
    }

    public List<Diamond> getAllDiamonds() {
        return diamondRepository.findAll();
    }

    public List<History> getDiamondHistory(String query) {
        if (query == null || query.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return historyRepository.findByDiamondIdOrBarcode(query.trim());
    }

    @Transactional
    public List<Diamond> receiveDiamondsBatch(Map<String, Object> data) {
        String companyId = data.get("companyId") != null ? String.valueOf(data.get("companyId")).trim() : "";
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Invalid Company ID: " + companyId));

        List<?> list = (data.get("diamondsList") instanceof List<?>) ? (List<?>) data.get("diamondsList") : Collections.emptyList();
        String receivedBy = data.get("receivedBy") != null ? String.valueOf(data.get("receivedBy")).trim() : "Supervisor";
        String remarks = data.get("remarks") != null ? String.valueOf(data.get("remarks")).trim() : "Received in batch";
        String serialNo = data.get("serialNo") != null ? String.valueOf(data.get("serialNo")).trim() : "";
        
        Double batchTotalWeight = null;
        Object rawBatchWeight = data.get("batchTotalWeight") != null ? data.get("batchTotalWeight") : data.get("totalWeight");
        if (rawBatchWeight != null && !String.valueOf(rawBatchWeight).trim().isEmpty()) {
            try { batchTotalWeight = Double.parseDouble(String.valueOf(rawBatchWeight).trim()); } catch (Exception ignored) {}
        }

        DateTimeUtil.FormattedTime timeInfo = DateTimeUtil.getFormattedTime();
        String receivedDate = (data.get("receivedDate") != null && !String.valueOf(data.get("receivedDate")).trim().isEmpty())
                ? String.valueOf(data.get("receivedDate")).trim()
                : timeInfo.getIsoDate();

        List<Diamond> createdList = new ArrayList<>();

        for (int k = 0; k < list.size(); k++) {
            Object obj = list.get(k);
            if (!(obj instanceof Map<?, ?> item)) continue;

            String barcode = item.get("barcode") != null ? String.valueOf(item.get("barcode")).trim().toUpperCase() : "";
            if (barcode.isEmpty()) continue;

            if (diamondRepository.existsByBarcodeIgnoreCase(barcode)) {
                throw new RuntimeException("Barcode " + barcode + " already exists!");
            }

            String shapeVal = item.get("shape") != null ? String.valueOf(item.get("shape")).trim() : "";
            String roughCutVal = item.get("roughCutNo") != null ? String.valueOf(item.get("roughCutNo")).trim() : "";
            String sizeVal = !shapeVal.isEmpty() ? shapeVal : (item.get("size") != null ? String.valueOf(item.get("size")).trim() : "-");

            Double weight = 0.0;
            if (item.get("weight") != null) {
                try { weight = Double.parseDouble(String.valueOf(item.get("weight")).trim()); } catch (Exception ignored) {}
            }

            Double scaleWeight = weight;
            if (item.get("scaleWeight") != null && !String.valueOf(item.get("scaleWeight")).trim().isEmpty()) {
                try { scaleWeight = Double.parseDouble(String.valueOf(item.get("scaleWeight")).trim()); } catch (Exception ignored) {}
            }

            Double targetWeight = null;
            if (item.get("targetWeight") != null && !String.valueOf(item.get("targetWeight")).trim().isEmpty()) {
                try { targetWeight = Double.parseDouble(String.valueOf(item.get("targetWeight")).trim()); } catch (Exception ignored) {}
            }

            String itemRemarks = item.get("remarks") != null ? String.valueOf(item.get("remarks")).trim() : remarks;

            Diamond diamond = new Diamond();
            diamond.setId("dia-" + System.currentTimeMillis() + "-" + (new Random().nextInt(900) + 100));
            diamond.setBarcode(barcode);
            diamond.setSerialNo(serialNo);
            diamond.setRoughCutNo(roughCutVal);
            diamond.setCompanyId(company.getId());
            diamond.setCompanyCode(company.getCode());
            diamond.setCompanyName(company.getName());
            diamond.setShape(shapeVal);
            diamond.setSize(sizeVal);
            diamond.setWeight(weight);
            diamond.setScaleWeight(scaleWeight);
            diamond.setTargetWeight(targetWeight);
            diamond.setBatchTotalWeight(batchTotalWeight);
            diamond.setReceivedDate(receivedDate);
            diamond.setReceivedBy(receivedBy);
            diamond.setStatus("RECEIVED");
            diamond.setRemarks(itemRemarks);

            Diamond saved = diamondRepository.save(diamond);
            createdList.add(saved);

            // Audit history
            String serialLog = !serialNo.isEmpty() ? "Sr: #" + serialNo + ", " : "";
            String batchLog = batchTotalWeight != null ? "Batch Wt: " + batchTotalWeight + " ct, " : "";
            String weightDetail = serialLog + batchLog + "Kacha Wt: " + weight + " ct";
            if (targetWeight != null) weightDetail += ", Teyar Wt: " + targetWeight + " ct";
            if (!roughCutVal.isEmpty()) weightDetail += ", Rough No: " + roughCutVal;
            if (!shapeVal.isEmpty()) weightDetail += ", Shape: " + shapeVal;

            History hist = new History(
                    "hist-" + System.currentTimeMillis() + "-" + k,
                    saved.getId(),
                    saved.getBarcode(),
                    "Diamond Received",
                    receivedBy,
                    timeInfo.getDateStr(),
                    timeInfo.getTimeStr(),
                    "Received from " + company.getName() + ". " + weightDetail + (!itemRemarks.isEmpty() ? " [" + itemRemarks + "]" : "")
            );
            historyRepository.save(hist);
        }

        return createdList;
    }

    @Transactional
    public Diamond updateDiamond(Map<String, Object> data) {
        String id = data.get("id") != null ? String.valueOf(data.get("id")).trim() : "";
        String barcode = data.get("barcode") != null ? String.valueOf(data.get("barcode")).trim().toUpperCase() : "";
        String originalBarcode = data.get("originalBarcode") != null ? String.valueOf(data.get("originalBarcode")).trim().toUpperCase() : barcode;
        String newBarcode = !barcode.isEmpty() ? barcode : originalBarcode;

        Optional<Diamond> targetOpt = Optional.empty();
        if (!id.isEmpty()) {
            targetOpt = diamondRepository.findById(id);
        }
        if (targetOpt.isEmpty() && !originalBarcode.isEmpty()) {
            targetOpt = diamondRepository.findByBarcodeIgnoreCase(originalBarcode);
        }

        Diamond target = targetOpt.orElseThrow(() -> new RuntimeException("Diamond record not found"));

        if (!newBarcode.isEmpty() && !newBarcode.equalsIgnoreCase(target.getBarcode())) {
            target.setBarcode(newBarcode);
        }
        if (data.containsKey("roughCutNo")) {
            target.setRoughCutNo(data.get("roughCutNo") != null ? String.valueOf(data.get("roughCutNo")).trim() : "");
        }
        if (data.containsKey("serialNo")) {
            target.setSerialNo(data.get("serialNo") != null ? String.valueOf(data.get("serialNo")).trim() : "");
        }
        if (data.containsKey("shape")) {
            String shape = data.get("shape") != null ? String.valueOf(data.get("shape")).trim() : "";
            target.setShape(shape);
            target.setSize(shape);
        }
        if (data.containsKey("weight") && data.get("weight") != null) {
            try { target.setWeight(Double.parseDouble(String.valueOf(data.get("weight")).trim())); } catch (Exception ignored) {}
        }
        if (data.containsKey("targetWeight")) {
            Object tw = data.get("targetWeight");
            if (tw != null && !String.valueOf(tw).trim().isEmpty()) {
                try { target.setTargetWeight(Double.parseDouble(String.valueOf(tw).trim())); } catch (Exception ignored) {}
            } else {
                target.setTargetWeight(null);
            }
        }
        if (data.containsKey("actualWeight")) {
            Object aw = data.get("actualWeight");
            if (aw != null && !String.valueOf(aw).trim().isEmpty()) {
                try { target.setActualWeight(Double.parseDouble(String.valueOf(aw).trim())); } catch (Exception ignored) {}
            } else {
                target.setActualWeight(null);
            }
        }
        if (data.containsKey("companyId")) {
            String cId = String.valueOf(data.get("companyId")).trim();
            if (!cId.equals(target.getCompanyId())) {
                companyRepository.findById(cId).ifPresent(comp -> {
                    target.setCompanyId(comp.getId());
                    target.setCompanyCode(comp.getCode());
                    target.setCompanyName(comp.getName());
                });
            }
        }
        if (data.containsKey("remarks")) {
            target.setRemarks(data.get("remarks") != null ? String.valueOf(data.get("remarks")).trim() : "");
        }
        if (data.containsKey("status") && data.get("status") != null) {
            target.setStatus(String.valueOf(data.get("status")).trim());
        }

        Diamond updated = diamondRepository.save(target);

        // Cascade barcode correction to history
        if (!newBarcode.isEmpty() && !originalBarcode.isEmpty() && !newBarcode.equalsIgnoreCase(originalBarcode)) {
            List<History> matchingHistories = historyRepository.findByBarcodeIgnoreCase(originalBarcode);
            for (History h : matchingHistories) {
                h.setBarcode(newBarcode);
                historyRepository.save(h);
            }
        }

        DateTimeUtil.FormattedTime timeInfo = DateTimeUtil.getFormattedTime();
        String barcodeNote = (!newBarcode.isEmpty() && !originalBarcode.isEmpty() && !newBarcode.equalsIgnoreCase(originalBarcode))
                ? "Barcode corrected: " + originalBarcode + " -> " + newBarcode + ". "
                : "";

        String editReason = data.get("editReason") != null ? String.valueOf(data.get("editReason")).trim() : "Correction of entry typo";
        String performedBy = data.get("updatedBy") != null ? String.valueOf(data.get("updatedBy")).trim() : "Admin Manager";

        History editHist = new History(
                "hist-" + System.currentTimeMillis(),
                updated.getId(),
                updated.getBarcode(),
                "Record Details Updated",
                performedBy,
                timeInfo.getDateStr(),
                timeInfo.getTimeStr(),
                barcodeNote + "Diamond specs updated: " + editReason
        );
        historyRepository.save(editHist);

        return updated;
    }

    @Transactional
    public Map<String, Object> assignDiamondsBatch(Map<String, Object> data) {
        List<String> barcodes = new ArrayList<>();
        if (data.get("barcodes") instanceof List<?> list) {
            for (Object item : list) {
                if (item != null && !String.valueOf(item).trim().isEmpty()) {
                    barcodes.add(String.valueOf(item).trim().toUpperCase());
                }
            }
        }
        if (data.get("barcode") != null) {
            String b = String.valueOf(data.get("barcode")).trim().toUpperCase();
            if (!b.isEmpty() && !barcodes.contains(b)) {
                barcodes.add(b);
            }
        }

        String workerId = data.get("workerId") != null ? String.valueOf(data.get("workerId")).trim() : "";
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found"));

        if (barcodes.isEmpty()) {
            throw new RuntimeException("No barcodes provided for assignment");
        }

        String assignedBy = data.get("assignedBy") != null ? String.valueOf(data.get("assignedBy")).trim() : "Supervisor";
        DateTimeUtil.FormattedTime timeInfo = DateTimeUtil.getFormattedTime();

        for (int b = 0; b < barcodes.size(); b++) {
            String bc = barcodes.get(b);
            diamondRepository.findByBarcodeIgnoreCase(bc).ifPresent(diamond -> {
                diamond.setAssignedWorkerId(worker.getId());
                diamond.setAssignedWorkerName(worker.getName());
                diamond.setAssignedDate(timeInfo.getIsoDate());
                diamond.setStatus("ASSIGNED");
                diamondRepository.save(diamond);

                History hist = new History(
                        "hist-" + System.currentTimeMillis() + "-" + b,
                        diamond.getId(),
                        bc,
                        "Assigned to " + worker.getName(),
                        assignedBy,
                        timeInfo.getDateStr(),
                        timeInfo.getTimeStr(),
                        "Assigned for " + worker.getDepartment() + " work"
                );
                historyRepository.save(hist);
            });
        }

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("count", barcodes.size());
        res.put("workerName", worker.getName());
        res.put("assignedWorkerId", worker.getId());
        return res;
    }

    @Transactional
    public Map<String, Object> startWork(Map<String, Object> data) {
        String barcode = data.get("barcode") != null ? String.valueOf(data.get("barcode")).trim().toUpperCase() : "";
        DateTimeUtil.FormattedTime timeInfo = DateTimeUtil.getFormattedTime();
        String workerName = data.get("workerName") != null ? String.valueOf(data.get("workerName")).trim() : "Worker";

        diamondRepository.findByBarcodeIgnoreCase(barcode).ifPresent(diamond -> {
            diamond.setStatus("IN PROGRESS");
            diamondRepository.save(diamond);

            History hist = new History(
                    "hist-" + System.currentTimeMillis(),
                    diamond.getId(),
                    barcode,
                    "Work Started",
                    workerName,
                    timeInfo.getDateStr(),
                    timeInfo.getTimeStr(),
                    "Production work in progress"
            );
            historyRepository.save(hist);
        });

        return Map.of("status", "IN PROGRESS");
    }

    @Transactional
    public Map<String, Object> markWorkCompleted(Map<String, Object> data) {
        String barcode = data.get("barcode") != null ? String.valueOf(data.get("barcode")).trim().toUpperCase() : "";
        DateTimeUtil.FormattedTime timeInfo = DateTimeUtil.getFormattedTime();
        String workerName = data.get("workerName") != null ? String.valueOf(data.get("workerName")).trim() : "Worker";

        diamondRepository.findByBarcodeIgnoreCase(barcode).ifPresent(diamond -> {
            diamond.setStatus("WORK COMPLETED");
            diamond.setCompletedDate(timeInfo.getIsoDate());
            diamond.setCompletedBy(workerName);
            diamondRepository.save(diamond);

            History hist = new History(
                    "hist-" + System.currentTimeMillis(),
                    diamond.getId(),
                    barcode,
                    "Work Completed",
                    workerName,
                    timeInfo.getDateStr(),
                    timeInfo.getTimeStr(),
                    "Worker marked diamond production completed"
            );
            historyRepository.save(hist);
        });

        return Map.of("status", "WORK COMPLETED", "completedDate", timeInfo.getIsoDate(), "completedBy", workerName);
    }

    @Transactional
    public Map<String, Object> depositDiamond(Map<String, Object> data) {
        String barcode = data.get("barcode") != null ? String.valueOf(data.get("barcode")).trim().toUpperCase() : "";
        DateTimeUtil.FormattedTime timeInfo = DateTimeUtil.getFormattedTime();
        String workerName = data.get("workerName") != null ? String.valueOf(data.get("workerName")).trim() : "Worker";

        diamondRepository.findByBarcodeIgnoreCase(barcode).ifPresent(diamond -> {
            diamond.setStatus("DEPOSITED");
            diamond.setDepositedDate(timeInfo.getIsoDate());
            diamondRepository.save(diamond);

            History hist = new History(
                    "hist-" + System.currentTimeMillis(),
                    diamond.getId(),
                    barcode,
                    "Diamond Deposited",
                    workerName,
                    timeInfo.getDateStr(),
                    timeInfo.getTimeStr(),
                    "Returned to safe for barcode & weight verification"
            );
            historyRepository.save(hist);
        });

        return Map.of("status", "DEPOSITED", "depositedDate", timeInfo.getIsoDate());
    }

    @Transactional
    public Map<String, Object> verifyDiamond(Map<String, Object> data) {
        String barcode = data.get("barcode") != null ? String.valueOf(data.get("barcode")).trim().toUpperCase() : "";
        Double actualWeight = 0.0;
        if (data.get("actualWeight") != null) {
            try { actualWeight = Double.parseDouble(String.valueOf(data.get("actualWeight")).trim()); } catch (Exception ignored) {}
        }

        boolean isApproved = false;
        if (data.get("isApproved") != null) {
            Object v = data.get("isApproved");
            isApproved = (v instanceof Boolean b) ? b : "true".equalsIgnoreCase(String.valueOf(v));
        }

        String verifiedBy = data.get("verifiedBy") != null ? String.valueOf(data.get("verifiedBy")).trim() : "QC Supervisor";
        String remarks = data.get("remarks") != null ? String.valueOf(data.get("remarks")).trim() : "";
        String newStatus = isApproved ? "COMPLETED" : "REWORK";

        DateTimeUtil.FormattedTime timeInfo = DateTimeUtil.getFormattedTime();
        final Double finalActualWeight = actualWeight;

        diamondRepository.findByBarcodeIgnoreCase(barcode).ifPresent(diamond -> {
            diamond.setActualWeight(finalActualWeight);
            diamond.setVerifiedDate(timeInfo.getIsoDate());
            diamond.setVerifiedBy(verifiedBy);
            diamond.setStatus(newStatus);
            if (!remarks.isEmpty()) diamond.setRemarks(remarks);
            diamondRepository.save(diamond);

            History h1 = new History(
                    "hist-" + System.currentTimeMillis() + "-1",
                    diamond.getId(),
                    barcode,
                    isApproved ? "Barcode & Weight Verified" : "QC Verification Failed (Rework)",
                    verifiedBy,
                    timeInfo.getDateStr(),
                    timeInfo.getTimeStr(),
                    "Actual Weight: " + finalActualWeight + " ct. " + remarks
            );
            historyRepository.save(h1);

            History h2 = new History(
                    "hist-" + System.currentTimeMillis() + "-2",
                    diamond.getId(),
                    barcode,
                    "Status changed to " + newStatus,
                    verifiedBy,
                    timeInfo.getDateStr(),
                    timeInfo.getTimeStr(),
                    isApproved ? "Approved & marked COMPLETED" : "Flagged for REWORK"
            );
            historyRepository.save(h2);
        });

        Map<String, Object> res = new HashMap<>();
        res.put("actualWeight", actualWeight);
        res.put("verifiedDate", timeInfo.getIsoDate());
        res.put("verifiedBy", verifiedBy);
        res.put("status", newStatus);
        return res;
    }

    @Transactional
    public Map<String, Object> submitDiamondsToCompany(Map<String, Object> data) {
        List<String> barcodes = new ArrayList<>();
        if (data.get("barcodes") instanceof List<?> list) {
            for (Object item : list) {
                if (item != null) barcodes.add(String.valueOf(item).trim().toUpperCase());
            }
        }

        DateTimeUtil.FormattedTime timeInfo = DateTimeUtil.getFormattedTime();
        String challanNo = data.get("challanNo") != null ? String.valueOf(data.get("challanNo")).trim() : "DC-" + System.currentTimeMillis();
        String receiver = data.get("receiverName") != null ? String.valueOf(data.get("receiverName")).trim() : "Company Representative";
        String company = data.get("companyName") != null ? String.valueOf(data.get("companyName")).trim() : "Client Company";
        String dispatchedBy = data.get("dispatchedBy") != null ? String.valueOf(data.get("dispatchedBy")).trim() : "Dispatch Supervisor";

        for (int i = 0; i < barcodes.size(); i++) {
            String bc = barcodes.get(i);
            diamondRepository.findByBarcodeIgnoreCase(bc).ifPresent(diamond -> {
                diamond.setStatus("RETURNED");
                diamond.setRemarks("Returned to " + company + " under Challan #" + challanNo);
                diamondRepository.save(diamond);

                History hist = new History(
                        "hist-" + System.currentTimeMillis() + "-" + (new Random().nextInt(900) + 100),
                        diamond.getId(),
                        bc,
                        "Submitted to Company",
                        dispatchedBy,
                        timeInfo.getDateStr(),
                        timeInfo.getTimeStr(),
                        "Returned under Challan #" + challanNo + ". Handed over to: " + receiver
                );
                historyRepository.save(hist);
            });
        }

        return Map.of("success", true, "count", barcodes.size(), "challanNo", challanNo);
    }
}

