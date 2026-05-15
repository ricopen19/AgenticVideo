import { Router, Request, Response } from 'express';
import {
  getScript,
  getScriptLine,
  updateScriptLine,
  createScriptLine,
  deleteScriptLine,
  reorderScript,
  bulkImportLines,
} from '../services/scriptService.js';

export const scriptRouter = Router();

// GET /api/script - Get all script lines
scriptRouter.get('/', (_req: Request, res: Response) => {
  try {
    const script = getScript();
    res.json(script);
  } catch (error) {
    console.error('Error getting script:', error);
    res.status(500).json({ error: 'Failed to get script' });
  }
});

// POST /api/script/bulk - Bulk import (replace or append)
scriptRouter.post('/bulk', (req: Request, res: Response) => {
  try {
    const { lines, mode } = req.body;
    if (!Array.isArray(lines) || !['replace', 'append'].includes(mode)) {
      res.status(400).json({ error: 'Invalid request: lines array and mode (replace|append) required' });
      return;
    }
    const result = bulkImportLines(lines, mode);
    res.json(result);
  } catch (error) {
    console.error('Error bulk importing:', error);
    res.status(500).json({ error: 'Failed to bulk import' });
  }
});

// GET /api/script/:id - Get a specific script line
scriptRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const line = getScriptLine(id);
    if (!line) {
      res.status(404).json({ error: 'Script line not found' });
      return;
    }
    res.json(line);
  } catch (error) {
    console.error('Error getting script line:', error);
    res.status(500).json({ error: 'Failed to get script line' });
  }
});

// PUT /api/script/reorder - Reorder script lines (must be before /:id)
scriptRouter.put('/reorder', (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      res.status(400).json({ error: 'ids must be an array' });
      return;
    }
    const reordered = reorderScript(ids);
    res.json(reordered);
  } catch (error) {
    console.error('Error reordering script:', error);
    res.status(500).json({ error: 'Failed to reorder script' });
  }
});

// PUT /api/script/:id - Update a script line
scriptRouter.put('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = req.body;
    const updated = updateScriptLine(id, data);
    res.json(updated);
  } catch (error) {
    console.error('Error updating script line:', error);
    res.status(500).json({ error: 'Failed to update script line' });
  }
});

// POST /api/script - Create a new script line
scriptRouter.post('/', (req: Request, res: Response) => {
  try {
    const data = req.body;
    const created = createScriptLine(data);
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating script line:', error);
    res.status(500).json({ error: 'Failed to create script line' });
  }
});

// DELETE /api/script/:id - Delete a script line
scriptRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    deleteScriptLine(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting script line:', error);
    res.status(500).json({ error: 'Failed to delete script line' });
  }
});

